import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { getWhatsAppTarget, setWhatsAppTarget, type WhatsAppTarget } from "@/lib/whatsapp/target";

/** FR-001/§15: profile info. TODO: preferences and future integrations. */
export function SettingsPage() {
  const { user } = useAuth();
  const [whatsAppTarget, setLocalWhatsAppTarget] = useState<WhatsAppTarget>(() =>
    getWhatsAppTarget(),
  );

  function handleWhatsAppTargetChange(value: WhatsAppTarget) {
    setLocalWhatsAppTarget(value);
    setWhatsAppTarget(value);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-4 max-w-md rounded-lg border border-border p-4 text-sm">
        <div className="text-muted-foreground">Signed in as</div>
        <div className="font-medium">{user?.email}</div>
      </div>

      <div className="mt-4 max-w-md rounded-lg border border-border p-4 text-sm">
        <div className="font-medium">WhatsApp account for sending</div>
        <p className="mt-1 text-muted-foreground">
          Choose which app opens on Android when you have both WhatsApp and WhatsApp Business
          installed. This can't control WhatsApp Web/Desktop — those always use whichever account
          is already logged into that browser session.
        </p>
        <select
          value={whatsAppTarget}
          onChange={(e) => handleWhatsAppTargetChange(e.target.value as WhatsAppTarget)}
          className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="default">Device default (ask / last used)</option>
          <option value="business">WhatsApp Business (Android)</option>
          <option value="personal">WhatsApp Personal (Android)</option>
        </select>
      </div>
    </div>
  );
}

