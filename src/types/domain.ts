import type { Database } from "@/types/database";

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type MessageTemplate = Database["public"]["Tables"]["message_templates"]["Row"];
export type MessageEvent = Database["public"]["Tables"]["message_events"]["Row"];
export type ImportRecord = Database["public"]["Tables"]["imports"]["Row"];
export type ImportError = Database["public"]["Tables"]["import_errors"]["Row"];
export type ColumnMapping = Database["public"]["Tables"]["column_mappings"]["Row"];

// FR-008: canonical contact status set, plus "won" (business addition: see docs/decisions.md).
export const CONTACT_STATUSES = [
  "pending",
  "prepared",
  "contacted",
  "replied",
  "follow_up",
  "not_interested",
  "do_not_contact",
  "won",
] as const;

export const CONTACT_STATUS_LABELS: Record<(typeof CONTACT_STATUSES)[number], string> = {
  pending: "Pending",
  prepared: "Prepared",
  contacted: "Message Sent",
  replied: "Got Reply",
  follow_up: "Follow-up",
  not_interested: "Not Interested",
  do_not_contact: "Do Not Contact",
  won: "Got Project",
};

// The raw Excel columns supported by the initial importer (FR-002).
export const SUPPORTED_EXCEL_COLUMNS = [
  "title",
  "totalScore",
  "reviewsCount",
  "street",
  "city",
  "state",
  "countryCode",
  "website",
  "phone",
  ...Array.from({ length: 10 }, (_, i) => `categories/${i}`),
  "url",
  "categoryName",
] as const;
