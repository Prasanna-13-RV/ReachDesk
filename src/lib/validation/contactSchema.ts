import { z } from "zod";

/**
 * FR-004: validation applied to a mapped row before it is imported. Phone
 * validity/normalization is computed separately (lib/phone) since it needs the
 * country-code hint; this schema only checks structural/required fields.
 */
export const importedContactSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  total_score: z.number().nullable().optional(),
  reviews_count: z.number().int().nullable().optional(),
  street: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone_raw: z.string().nullable().optional(),
  source_categories: z.array(z.string()).default([]),
  category_name: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
});

export type ImportedContactInput = z.infer<typeof importedContactSchema>;

export const messageTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  content: z.string().trim().min(1, "Template content is required"),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  description: z.string().nullable().optional(),
});
