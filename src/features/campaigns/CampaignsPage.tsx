import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import type { Campaign } from "@/types/domain";

/** FR-009: create/list campaigns. TODO(Phase 6): membership management + status metrics. */
export function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCampaigns(data as Campaign[]);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("campaigns")
      .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null });
    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Campaign created.");
    setName("");
    setDescription("");
    await loadCampaigns();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Campaigns</h1>

      <form onSubmit={handleCreate} className="mt-4 flex max-w-xl flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Campaign name"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="w-fit rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Create campaign
        </button>
      </form>

      <ul className="mt-8 space-y-2">
        {campaigns.map((c) => (
          <li key={c.id} className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium">{c.name}</div>
            {c.description && <div className="text-muted-foreground">{c.description}</div>}
            <div className="mt-1 text-xs uppercase text-muted-foreground">{c.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
