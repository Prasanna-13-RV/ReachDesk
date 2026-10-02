import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js";
import { getAndroidPackage, isAndroid, type WhatsAppTarget } from "@/lib/whatsapp/target";

export interface NormalizedPhone {
  /** E.164 formatted number, e.g. "+14155552671". Null when the number could not be validated. */
  e164: string | null;
  /** wa.me-compatible digits only, no leading "+". Null when invalid. */
  waNumber: string | null;
  isValid: boolean;
}

/**
 * Normalizes a raw phone string to E.164 using an optional ISO country code hint
 * (e.g. from the Excel `countryCode` column). FR-004: invalid/ambiguous numbers
 * are flagged rather than silently converted.
 */
export function normalizePhone(
  rawPhone: string | null | undefined,
  countryCodeHint?: string | null,
): NormalizedPhone {
  const invalid: NormalizedPhone = { e164: null, waNumber: null, isValid: false };

  if (!rawPhone || !rawPhone.trim()) {
    return invalid;
  }

  const hint = normalizeCountryHint(countryCodeHint);

  try {
    const parsed = hint
      ? parsePhoneNumberWithError(rawPhone, hint)
      : parsePhoneNumberWithError(rawPhone);

    if (!parsed || !parsed.isValid()) {
      return invalid;
    }

    const e164 = parsed.number; // already E.164, e.g. +14155552671
    return {
      e164,
      waNumber: e164.replace(/^\+/, ""),
      isValid: true,
    };
  } catch {
    return invalid;
  }
}

function normalizeCountryHint(countryCodeHint?: string | null): CountryCode | undefined {
  if (!countryCodeHint) return undefined;
  const trimmed = countryCodeHint.trim().toUpperCase();
  // libphonenumber-js expects a 2-letter ISO country code (e.g. "US", "IN").
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed as CountryCode;
  }
  return undefined;
}

/**
 * Builds the WhatsApp URL for a validated, normalized phone number (FR-007, §18).
 * On Android, a non-default `target` deep-links straight into WhatsApp Business/Personal,
 * skipping the "open with" chooser. Desktop/WhatsApp Web always falls back to wa.me, since
 * there's no way to pick an account there — it uses whatever session is already logged in.
 */
export function buildWhatsAppUrl(
  normalized: NormalizedPhone,
  prefilledText?: string,
  target: WhatsAppTarget = "default",
): string | null {
  if (!normalized.isValid || !normalized.waNumber) {
    return null;
  }

  const androidPackage = getAndroidPackage(target);
  if (androidPackage && isAndroid()) {
    const textParam = prefilledText ? `&text=${encodeURIComponent(prefilledText)}` : "";
    return `intent://send?phone=${normalized.waNumber}${textParam}#Intent;scheme=whatsapp;package=${androidPackage};end`;
  }

  const base = `https://wa.me/${normalized.waNumber}`;
  if (!prefilledText) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(prefilledText)}`;
}
