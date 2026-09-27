import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, normalizePhone } from "@/lib/phone/normalize";

describe("normalizePhone", () => {
  it("normalizes a valid US number with a country hint", () => {
    const result = normalizePhone("(415) 555-2671", "US");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+14155552671");
    expect(result.waNumber).toBe("14155552671");
  });

  it("normalizes a number that already includes a country code", () => {
    const result = normalizePhone("+91 98765 43210");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+919876543210");
  });

  it("flags an invalid number instead of silently converting it", () => {
    const result = normalizePhone("12345", "US");
    expect(result.isValid).toBe(false);
    expect(result.e164).toBeNull();
  });

  it("treats an empty phone as invalid without throwing", () => {
    const result = normalizePhone(null);
    expect(result.isValid).toBe(false);
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me URL for a valid normalized phone", () => {
    const normalized = normalizePhone("(415) 555-2671", "US");
    expect(buildWhatsAppUrl(normalized)).toBe("https://wa.me/14155552671");
  });

  it("returns null for an invalid phone", () => {
    const normalized = normalizePhone("invalid");
    expect(buildWhatsAppUrl(normalized)).toBeNull();
  });

  it("includes prefilled text when provided", () => {
    const normalized = normalizePhone("(415) 555-2671", "US");
    expect(buildWhatsAppUrl(normalized, "Hi there")).toBe(
      "https://wa.me/14155552671?text=Hi%20there",
    );
  });
});
