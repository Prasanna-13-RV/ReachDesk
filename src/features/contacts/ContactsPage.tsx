import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from "@/types/domain";
import type { Contact } from "@/types/domain";
import type { ContactStatus } from "@/types/database";
import { normalizePhone, buildWhatsAppUrl } from "@/lib/phone/normalize";
import { renderTemplate } from "@/lib/templates/renderTemplate";
import { ContactFormModal } from "@/features/contacts/ContactFormModal";

/**
 * FR-005 contact list: search + table with per-contact WhatsApp, status, and
 * edit actions, plus manual add (Phase 3/5).
 * TODO(Phase 3): sorting, city/category/campaign filters, row virtualization
 * for 10k+ rows (NFR-003).
 */
export function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsLoading(true);
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (!cancelled) {
        if (!error && data) setContacts(data as Contact[]);
        setIsLoading(false);
      }
    }, 300); // debounce search input (Performance Strategy §21)

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search]);

  useEffect(() => {
    // Most recently created active template is used to prefill WhatsApp messages.
    supabase
      .from("message_templates")
      .select("content")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setTemplateContent(data?.content ?? null));
  }, []);

  async function reloadContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (!error && data) setContacts(data as Contact[]);
  }

  function handleWhatsApp(contact: Contact) {
    if (contact.do_not_contact) {
      toast.error(`${contact.title} is marked "Do Not Contact".`);
      return;
    }
    const normalized = normalizePhone(contact.phone_normalized ?? contact.phone_raw, contact.country_code);
    if (!normalized.isValid) {
      toast.error("This contact doesn't have a valid phone number.");
      return;
    }
    const text = templateContent
      ? renderTemplate(templateContent, {
          title: contact.title,
          city: contact.city,
          state: contact.state,
          categoryName: contact.category_name,
          website: contact.website,
          phone: normalized.e164 ?? undefined,
        }).text
      : undefined;
    const url = buildWhatsAppUrl(normalized, text);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    void supabase.from("message_events").insert({
      user_id: contact.user_id,
      contact_id: contact.id,
      campaign_id: null,
      template_id: null,
      event_type: "opened_whatsapp",
      message_snapshot: text ?? "",
      phone_used: normalized.e164 ?? "",
    });
  }

  async function handleStatusChange(contact: Contact, status: ContactStatus) {
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, status } : c)));
    const { error } = await supabase.from("contacts").update({ status }).eq("id", contact.id);
    if (error) {
      toast.error(error.message);
      await reloadContacts();
      return;
    }
    toast.success(`${contact.title} marked as "${CONTACT_STATUS_LABELS[status]}".`);
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Delete "${contact.title}"? This cannot be undone.`)) return;

    const previous = contacts;
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
    if (error) {
      toast.error(error.message);
      setContacts(previous);
      return;
    }
    toast.success(`${contact.title} deleted.`);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Add contact
        </button>
      </div>

      <input
        type="search"
        placeholder="Search by business title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-sm rounded-md border border-border px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Website</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">WhatsApp</th>
              <th className="px-3 py-2">Edit</th>
              <th className="px-3 py-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={9}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && contacts.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={9}>
                  No contacts yet. Import an Excel file or add one manually to get started.
                </td>
              </tr>
            )}
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-t border-border">
                <td className="px-3 py-2">{contact.title}</td>
                <td className="px-3 py-2">{contact.city ?? "—"}</td>
                <td className="px-3 py-2">
                  {contact.phone_valid ? contact.phone_normalized : (contact.phone_raw ?? "—")}
                </td>
                <td className="px-3 py-2">
                  {contact.website ? (
                    <a
                      href={
                        contact.website.startsWith("http")
                          ? contact.website
                          : `https://${contact.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {contact.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">{contact.category_name ?? "—"}</td>
                <td className="px-3 py-2">
                  <select
                    value={contact.status}
                    onChange={(e) => handleStatusChange(contact, e.target.value as ContactStatus)}
                    className="rounded-md border border-border px-2 py-1 text-sm"
                  >
                    {CONTACT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CONTACT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(contact)}
                    disabled={!contact.phone_valid || contact.do_not_contact}
                    className="rounded-md border border-border px-2 py-1 text-xs font-medium text-green-700 disabled:opacity-40"
                    title="Open WhatsApp chat in a new tab"
                  >
                    WhatsApp
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setEditingContact(contact)}
                    className="rounded-md border border-border px-2 py-1 text-xs font-medium"
                  >
                    Edit
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(contact)}
                    className="rounded-md border border-destructive px-2 py-1 text-xs font-medium text-destructive"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isAdding || editingContact) && user && (
        <ContactFormModal
          userId={user.id}
          contact={editingContact}
          onClose={() => {
            setIsAdding(false);
            setEditingContact(null);
          }}
          onSaved={reloadContacts}
        />
      )}
    </div>
  );
}

