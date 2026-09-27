import { useMemo, useState } from "react";
import { toast } from "sonner";
import { parseWorkbookFile, type ParsedWorkbook } from "@/lib/excel/parseWorkbook";
import { autoMapColumns, type ColumnMapping } from "@/lib/excel/columnMapping";
import { normalizePhone } from "@/lib/phone/normalize";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import type { Database } from "@/types/database";

type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];

interface PreparedRow {
  rowKey: string;
  sheetName: string;
  sheetRowNumber: number;
  contact: ContactInsert;
  errors: string[];
}

interface RejectedRow {
  rowKey: string;
  sheetName: string;
  sheetRowNumber: number;
  title: string;
  reasons: string[];
}

/**
 * FR-002/003/004: upload .xlsx, auto-map columns, validate/normalize, preview,
 * then import. TODO(Phase 2): manual re-mapping UI for unmatched columns and
 * persisting reusable ColumnMapping via lib/excel + column_mappings table.
 */
export function ImportPage() {
  const { user } = useAuth();
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [rejectedRows, setRejectedRows] = useState<RejectedRow[] | null>(null);

  const prepared = useMemo<PreparedRow[]>(() => {
    if (!workbook || !user) return [];
    return buildPreparedRows(workbook, mapping, user.id);
  }, [workbook, mapping, user]);

  const validCount = prepared.filter((r) => r.errors.length === 0).length;
  const duplicatePhones = useMemo(() => findDuplicatePhones(prepared), [prepared]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseWorkbookFile(file);
      setWorkbook(parsed);
      setMapping(autoMapColumns(parsed.columns));
      setRejectedRows(null);
      toast.success(
        parsed.sheetNames.length > 1
          ? `Loaded ${parsed.rows.length} rows from ${parsed.sheetNames.length} sheets.`
          : `Loaded ${parsed.rows.length} rows.`,
      );
    } catch (err) {
      setWorkbook(null);
      toast.error(err instanceof Error ? err.message : "Failed to read file.");
    }
  }

  async function handleImport() {
    if (!workbook || !user) return;
    setIsImporting(true);
    setRejectedRows(null);

    // Reasons keyed by rowKey so DB-level duplicate detection (below) and
    // in-file duplicate detection can be merged into one list per row.
    const reasonsByRow = new Map<string, string[]>();
    for (const row of prepared) {
      if (row.errors.length > 0) reasonsByRow.set(row.rowKey, [...row.errors]);
    }
    for (const rowKey of duplicatePhones) {
      const existing = reasonsByRow.get(rowKey) ?? [];
      existing.push("Duplicate phone number (also appears elsewhere in this file)");
      reasonsByRow.set(rowKey, existing);
    }

    // Rows that pass structural/in-file checks may still collide with a
    // contact already saved from a previous import - check up front so one
    // bad row can't fail an entire insert batch.
    const candidateRows = prepared.filter((r) => !reasonsByRow.has(r.rowKey));
    const candidatePhones = Array.from(
      new Set(candidateRows.map((r) => r.contact.phone_normalized).filter((p): p is string => !!p)),
    );
    if (candidatePhones.length > 0) {
      const { data: existingContacts } = await supabase
        .from("contacts")
        .select("phone_normalized")
        .eq("user_id", user.id)
        .in("phone_normalized", candidatePhones);
      const existingPhoneSet = new Set(
        (existingContacts ?? []).map((c) => c.phone_normalized).filter((p): p is string => !!p),
      );
      for (const row of candidateRows) {
        if (row.contact.phone_normalized && existingPhoneSet.has(row.contact.phone_normalized)) {
          reasonsByRow.set(row.rowKey, ["Phone number already exists in your contacts"]);
        }
      }
    }

    const rowsToInsert = prepared.filter((r) => !reasonsByRow.has(r.rowKey));

    const { data: importRow, error: importInsertError } = await supabase
      .from("imports")
      .insert({
        user_id: user.id,
        file_name: workbook.fileName,
        row_count: prepared.length,
        imported_count: 0,
        rejected_count: reasonsByRow.size,
        duplicate_count: duplicatePhones.size,
      })
      .select()
      .single();

    if (importInsertError || !importRow) {
      toast.error(`Failed to start import: ${importInsertError?.message}`);
      setIsImporting(false);
      return;
    }

    let importedCount = 0;
    const batchSize = 200; // §21 performance strategy: batch inserts
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const { error: insertError, count } = await supabase
        .from("contacts")
        .insert(batch.map((r) => r.contact), { count: "exact" });
      if (!insertError) {
        importedCount += count ?? batch.length;
        continue;
      }
      // A batch can fail entirely if e.g. a race added a duplicate phone after
      // our pre-check above; fall back to inserting rows one at a time so a
      // single bad row doesn't reject the whole batch.
      for (const row of batch) {
        const { error: rowError } = await supabase.from("contacts").insert(row.contact);
        if (rowError) {
          reasonsByRow.set(row.rowKey, [rowError.message]);
        } else {
          importedCount += 1;
        }
      }
    }

    const rowErrors = Array.from(reasonsByRow.entries()).flatMap(([rowKey, reasons]) => {
      const row = prepared.find((r) => r.rowKey === rowKey);
      if (!row) return [];
      return reasons.map((message) => ({
        import_id: importRow.id,
        row_number: row.sheetRowNumber,
        field: null,
        error_message: `[${row.sheetName}] ${message}`,
      }));
    });
    if (rowErrors.length > 0) {
      await supabase.from("import_errors").insert(rowErrors);
    }

    await supabase
      .from("imports")
      .update({ imported_count: importedCount, rejected_count: reasonsByRow.size })
      .eq("id", importRow.id);

    const finalRejected: RejectedRow[] = Array.from(reasonsByRow.entries())
      .map(([rowKey, reasons]) => {
        const row = prepared.find((r) => r.rowKey === rowKey);
        if (!row) return null;
        return {
          rowKey,
          sheetName: row.sheetName,
          sheetRowNumber: row.sheetRowNumber,
          title: row.contact.title,
          reasons,
        };
      })
      .filter((r): r is RejectedRow => r !== null)
      .sort((a, b) => a.sheetRowNumber - b.sheetRowNumber);
    setRejectedRows(finalRejected);

    if (finalRejected.length === 0) {
      toast.success(`Imported all ${importedCount} rows.`);
    } else {
      toast.warning(
        `Imported ${importedCount} of ${prepared.length} rows. ${finalRejected.length} rejected/duplicate — see details below.`,
      );
    }
    setIsImporting(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Import Contacts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload an .xlsx file exported from your data source.
      </p>

      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="mt-4 text-sm"
      />

      {workbook && (
        <div className="mt-6 space-y-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{workbook.fileName}</span> —{" "}
            {workbook.rows.length} rows across {workbook.sheetNames.length} sheet
            {workbook.sheetNames.length === 1 ? "" : "s"} ({workbook.sheetNames.join(", ")}),{" "}
            {workbook.columns.length} columns detected.
          </div>

          <div className="rounded-lg border border-border p-4 text-sm">
            <div>
              Valid rows: <span className="font-medium">{validCount}</span>
            </div>
            <div>
              Rows with errors:{" "}
              <span className="font-medium">{prepared.length - validCount}</span>
            </div>
            <div>
              Duplicate phone numbers in this file:{" "}
              <span className="font-medium">{duplicatePhones.size}</span>
            </div>
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Sheet</th>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {prepared.slice(0, 100).map((row) => (
                  <tr key={row.rowKey} className="border-t border-border">
                    <td className="px-3 py-2">{row.sheetName}</td>
                    <td className="px-3 py-2">{row.sheetRowNumber}</td>
                    <td className="px-3 py-2">{row.contact.title}</td>
                    <td className="px-3 py-2">
                      {row.contact.phone_normalized ?? row.contact.phone_raw ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {duplicatePhones.has(row.rowKey)
                        ? "Duplicate phone"
                        : row.errors.length > 0
                          ? row.errors.join("; ")
                          : "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            disabled={isImporting || validCount === 0}
            onClick={handleImport}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isImporting ? "Importing…" : `Import ${validCount} valid rows`}
          </button>

          {rejectedRows && (
            <div className="rounded-lg border border-border p-4 text-sm">
              <div className="font-medium">
                {rejectedRows.length === 0
                  ? "No rows were rejected."
                  : `${rejectedRows.length} row(s) rejected/duplicate:`}
              </div>
              {rejectedRows.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {rejectedRows.map((row) => (
                    <li key={row.rowKey} className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {row.sheetName} row {row.sheetRowNumber}
                      </span>{" "}
                      ({row.title}) — {row.reasons.join("; ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildPreparedRows(
  workbook: ParsedWorkbook,
  mapping: ColumnMapping,
  userId: string,
): PreparedRow[] {
  return workbook.rows.map(({ sheetName, sheetRowNumber, data }) => {
    const errors: string[] = [];
    const categories: string[] = [];
    const fields: Record<string, unknown> = {};

    for (const [column, field] of Object.entries(mapping)) {
      if (!field) continue;
      const value = data[column];
      if (field === "source_categories") {
        if (value !== null && value !== undefined && String(value).trim() !== "") {
          categories.push(String(value));
        }
        continue;
      }
      fields[field] = value;
    }

    const title = typeof fields.title === "string" ? fields.title.trim() : "";
    if (!title) errors.push("Missing title");

    const phoneRaw = fields.phone_raw != null ? String(fields.phone_raw) : null;
    const countryCode = fields.country_code != null ? String(fields.country_code) : null;
    const normalized = normalizePhone(phoneRaw, countryCode);
    if (phoneRaw && !normalized.isValid) {
      errors.push("Invalid phone number");
    }

    const contact: ContactInsert = {
      user_id: userId,
      title: title || `${sheetName} row ${sheetRowNumber}`,
      total_score: toNumberOrNull(fields.total_score),
      reviews_count: toNumberOrNull(fields.reviews_count),
      street: toStringOrNull(fields.street),
      city: toStringOrNull(fields.city),
      state: toStringOrNull(fields.state),
      country_code: toStringOrNull(fields.country_code),
      website: toStringOrNull(fields.website),
      phone_raw: phoneRaw,
      phone_normalized: normalized.e164,
      phone_valid: normalized.isValid,
      source_categories: categories,
      category_name: toStringOrNull(fields.category_name),
      source_url: toStringOrNull(fields.source_url),
    };

    return {
      rowKey: `${sheetName}#${sheetRowNumber}`,
      sheetName,
      sheetRowNumber,
      contact,
      errors,
    };
  });
}

function findDuplicatePhones(prepared: PreparedRow[]): Set<string> {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const row of prepared) {
    const phone = row.contact.phone_normalized;
    if (!phone) continue;
    if (seen.has(phone)) {
      duplicates.add(row.rowKey);
    } else {
      seen.set(phone, row.rowKey);
    }
  }
  return duplicates;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}
