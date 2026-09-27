import { supabase } from "@/lib/supabase/client";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/phone/normalize";
import { renderTemplate, type PlaceholderValues } from "@/lib/templates/renderTemplate";
import type { Contact } from "@/types/domain";

export interface PrepareWhatsAppResult {
  success: boolean;
  message?: string;
  url?: string;
  reason?: "invalid_phone" | "do_not_contact" | "clipboard_failed";
}

/**
 * FR-007: renders the template, copies the message, and opens wa.me for a
 * contact. Never auto-sends. Logging the message_event is best-effort and
 * must not block the WhatsApp action (§9 marks it optional).
 */
export async function prepareWhatsAppMessage(
  contact: Contact,
  templateContent: string,
  campaignId: string | null,
  templateId: string | null,
): Promise<PrepareWhatsAppResult> {
  if (contact.do_not_contact) {
    return { success: false, reason: "do_not_contact" };
  }

  const normalized = normalizePhone(contact.phone_normalized ?? contact.phone_raw, contact.country_code);
  const url = buildWhatsAppUrl(normalized);
  if (!normalized.isValid || !url) {
    return { success: false, reason: "invalid_phone" };
  }

  const placeholderValues: PlaceholderValues = {
    title: contact.title,
    city: contact.city,
    state: contact.state,
    categoryName: contact.category_name,
    website: contact.website,
    phone: normalized.e164 ?? undefined,
  };
  const { text } = renderTemplate(templateContent, placeholderValues);

  let clipboardOk = true;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    clipboardOk = false;
  }

  window.open(url, "_blank", "noopener,noreferrer");

  await logMessageEvent(contact, text, normalized.e164 ?? "", campaignId, templateId);

  if (!clipboardOk) {
    return { success: true, message: text, url, reason: "clipboard_failed" };
  }
  return { success: true, message: text, url };
}

async function logMessageEvent(
  contact: Contact,
  messageSnapshot: string,
  phoneUsed: string,
  campaignId: string | null,
  templateId: string | null,
) {
  try {
    await supabase.from("message_events").insert({
      user_id: contact.user_id,
      contact_id: contact.id,
      campaign_id: campaignId,
      template_id: templateId,
      event_type: "opened_whatsapp",
      message_snapshot: messageSnapshot,
      phone_used: phoneUsed,
    });
  } catch {
    // Best-effort logging only; never block the WhatsApp action on this.
  }
}
