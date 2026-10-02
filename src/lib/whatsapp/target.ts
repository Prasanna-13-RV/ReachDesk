// Lets a user pick which WhatsApp app handles outgoing links on Android when
// both Personal and Business are installed. There is no equivalent control on
// desktop/WhatsApp Web — that always uses whichever account is already logged
// into the browser session.
export type WhatsAppTarget = "default" | "business" | "personal";

const STORAGE_KEY = "reachdesk:whatsapp-target";

export function getWhatsAppTarget(): WhatsAppTarget {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "business" || stored === "personal" ? stored : "default";
}

export function setWhatsAppTarget(target: WhatsAppTarget): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, target);
}

const ANDROID_PACKAGES: Record<"business" | "personal", string> = {
  business: "com.whatsapp.w4b",
  personal: "com.whatsapp",
};

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/** Returns the Android package to deep-link into, or undefined for the device default. */
export function getAndroidPackage(target: WhatsAppTarget): string | undefined {
  return target === "default" ? undefined : ANDROID_PACKAGES[target];
}
