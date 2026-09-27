// FR-006 / §17: template placeholder engine.
// Supported placeholders in V1.
export const SUPPORTED_PLACEHOLDERS = [
  "title",
  "city",
  "state",
  "categoryName",
  "website",
  "phone",
] as const;

export type PlaceholderKey = (typeof SUPPORTED_PLACEHOLDERS)[number];

export type PlaceholderValues = Partial<Record<PlaceholderKey, string | null | undefined>>;

export interface RenderResult {
  text: string;
  missingPlaceholders: string[];
  unknownPlaceholders: string[];
}

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

// Placeholders are matched case-insensitively, with "category" accepted as a
// shorthand alias for "categoryName" (e.g. {{Title}}, {{CATEGORY}}, {{category}}).
const PLACEHOLDER_ALIASES: Record<string, PlaceholderKey> = {
  title: "title",
  city: "city",
  state: "state",
  categoryname: "categoryName",
  category: "categoryName",
  website: "website",
  phone: "phone",
};

function resolvePlaceholderKey(rawKey: string): PlaceholderKey | null {
  return PLACEHOLDER_ALIASES[rawKey.toLowerCase()] ?? null;
}

/**
 * Resolves {{placeholder}} tokens against contact field values without mutating
 * the stored template. Missing values render as an empty string but are
 * reported so the UI can warn the user (FR-006).
 */
export function renderTemplate(template: string, values: PlaceholderValues): RenderResult {
  const missingPlaceholders = new Set<string>();
  const unknownPlaceholders = new Set<string>();

  const text = template.replace(PLACEHOLDER_PATTERN, (_match, rawKey: string) => {
    const key = resolvePlaceholderKey(rawKey);
    if (!key) {
      unknownPlaceholders.add(rawKey);
      return "";
    }
    const value = values[key];
    if (value === null || value === undefined || value === "") {
      missingPlaceholders.add(rawKey);
      return "";
    }
    return value;
  });

  return {
    text,
    missingPlaceholders: [...missingPlaceholders],
    unknownPlaceholders: [...unknownPlaceholders],
  };
}
