import { useAuth } from "@/features/auth/useAuth";

/** FR-001/§15: profile info. TODO: preferences and future integrations. */
export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-4 max-w-md rounded-lg border border-border p-4 text-sm">
        <div className="text-muted-foreground">Signed in as</div>
        <div className="font-medium">{user?.email}</div>
      </div>
    </div>
  );
}
