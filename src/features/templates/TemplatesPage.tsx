import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import type { MessageTemplate } from "@/types/domain";

/** FR-006: create/edit/list message templates. */
export function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState(
    "Hi {{title}},\n\nI came across your business in {{city}}. We help {{categoryName}} businesses grow.\n\nWould you be interested in learning more?",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    const { data } = await supabase
      .from("message_templates")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data as MessageTemplate[]);
  }

  function handleEdit(template: MessageTemplate) {
    setEditingId(template.id);
    setName(template.name);
    setContent(template.content);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setContent("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !name.trim() || !content.trim()) return;
    setIsSaving(true);

    const { error } = editingId
      ? await supabase
          .from("message_templates")
          .update({ name: name.trim(), content })
          .eq("id", editingId)
      : await supabase
          .from("message_templates")
          .insert({ user_id: user.id, name: name.trim(), content });

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Template updated." : "Template saved.");
    handleCancelEdit();
    await loadTemplates();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Message Templates</h1>

      <form onSubmit={handleSubmit} className="mt-4 max-w-xl space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isSaving ? "Saving…" : editingId ? "Save changes" : "Save template"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="mt-8 space-y-2">
        {templates.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm"
          >
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="whitespace-pre-wrap text-muted-foreground">{t.content}</div>
            </div>
            <button
              type="button"
              onClick={() => handleEdit(t)}
              className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
