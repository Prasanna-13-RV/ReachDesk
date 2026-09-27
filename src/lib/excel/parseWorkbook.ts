import * as XLSX from "xlsx";

export interface ParsedWorkbookRow {
  sheetName: string;
  /** 1-based row number within its own sheet (header row is 1). */
  sheetRowNumber: number;
  data: Record<string, unknown>;
}

export interface ParsedWorkbook {
  fileName: string;
  sheetNames: string[];
  /** Union of columns detected across all sheets. */
  columns: string[];
  rows: ParsedWorkbookRow[];
}

/**
 * Parses every sheet of an .xlsx file entirely in-browser (§9 data flow,
 * FR-002) and merges their rows into a single dataset. Sheets are expected to
 * share the same column layout (e.g. multiple export batches in one file);
 * columns are unioned so sheet-specific extra/missing columns don't error out.
 */
export async function parseWorkbookFile(file: File): Promise<ParsedWorkbook> {
  if (!isXlsxFile(file)) {
    throw new Error("Unsupported file type. Please upload an .xlsx file.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  if (workbook.SheetNames.length === 0) {
    throw new Error("The workbook does not contain any sheets.");
  }

  const rows: ParsedWorkbookRow[] = [];
  const columnSet = new Set<string>();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    sheetRows.forEach((data, index) => {
      for (const column of Object.keys(data)) columnSet.add(column);
      rows.push({ sheetName, sheetRowNumber: index + 2, data });
    });
  }

  if (rows.length === 0) {
    throw new Error("No data rows found in any sheet of this workbook.");
  }

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    columns: Array.from(columnSet),
    rows,
  };
}

function isXlsxFile(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith(".xlsx");
  const typeOk =
    file.type === "" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return nameOk && typeOk;
}
