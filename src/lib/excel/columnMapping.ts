import { SUPPORTED_EXCEL_COLUMNS } from "@/types/domain";

export type AppContactField =
  | "title"
  | "total_score"
  | "reviews_count"
  | "street"
  | "city"
  | "state"
  | "country_code"
  | "website"
  | "phone_raw"
  | "source_categories"
  | "source_url"
  | "category_name";

/** §12: Excel column -> application field mapping. */
export type ColumnMapping = Record<string, AppContactField | null>;

const NORMALIZED_DEFAULT_MAP: Record<string, AppContactField> = {
  title: "title",
  totalscore: "total_score",
  reviewscount: "reviews_count",
  street: "street",
  city: "city",
  state: "state",
  countrycode: "country_code",
  website: "website",
  phone: "phone_raw",
  url: "source_url",
  categoryname: "category_name",
};

function normalizeColumnName(column: string): string {
  return column.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isCategoryIndexColumn(column: string): boolean {
  return /^categories\/\d+$/.test(column.trim());
}

/**
 * FR-003: attempts automatic column mapping by normalized name. `categories/0..9`
 * columns are grouped into the `source_categories` array field. Unmatched
 * columns are returned mapped to `null` for the user to map manually or ignore.
 */
export function autoMapColumns(detectedColumns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const column of detectedColumns) {
    if (isCategoryIndexColumn(column)) {
      mapping[column] = "source_categories";
      continue;
    }
    const normalized = normalizeColumnName(column);
    mapping[column] = NORMALIZED_DEFAULT_MAP[normalized] ?? null;
  }

  return mapping;
}

export function getUnmappedColumns(mapping: ColumnMapping): string[] {
  return Object.entries(mapping)
    .filter(([, field]) => field === null)
    .map(([column]) => column);
}

export function isKnownExcelColumn(column: string): boolean {
  return (
    (SUPPORTED_EXCEL_COLUMNS as readonly string[]).includes(column) ||
    isCategoryIndexColumn(column)
  );
}
