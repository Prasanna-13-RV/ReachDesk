import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone/normalize";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS } from "@/types/domain";
import type { Contact } from "@/types/domain";
import type { ContactStatus } from "@/types/database";

interface ContactFormValues {
  title: string;
  phone_raw: string;
  country_code: string;
  website: string;
  street: string;
  city: string;
  state: string;
  category_name: string;
  notes: string;
  status: ContactStatus;
  do_not_contact: boolean;
}

function toFormValues(contact: Contact | null): ContactFormValues {
  return {
    title: contact?.title ?? "",
    phone_raw: contact?.phone_raw ?? "",
    country_code: contact?.country_code ?? "",
    website: contact?.website ?? "",
    street: contact?.street ?? "",
    city: contact?.city ?? "",
    state: contact?.state ?? "",
    category_name: contact?.category_name ?? "",
    notes: contact?.notes ?? "",
    status: contact?.status ?? "pending",
    do_not_contact: contact?.do_not_contact ?? false,
  };
}

interface ContactFormModalProps {
  userId: string;
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Manual "add contact" / "edit contact" modal — also doubles as the full contact detail view. */
export function ContactFormModal({ userId, contact, onClose, onSaved }: ContactFormModalProps) {
  const [values, setValues] = useState<ContactFormValues>(() => toFormValues(contact));
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = contact !== null;

  function update<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    const normalized = normalizePhone(values.phone_raw || null, values.country_code || null);
    if (values.phone_raw.trim() && !normalized.isValid) {
      toast.error("Phone number could not be validated. Include a country code hint if needed.");
      return;
    }

    setIsSaving(true);
    const payload = {
      user_id: userId,
      title: values.title.trim(),
      phone_raw: values.phone_raw.trim() || null,
      phone_normalized: normalized.e164,
      phone_valid: normalized.isValid,
      country_code: values.country_code.trim() || null,
      website: values.website.trim() || null,
      street: values.street.trim() || null,
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      category_name: values.category_name.trim() || null,
      notes: values.notes.trim() || null,
      status: values.status,
      do_not_contact: values.do_not_contact,
    };

    const { error } = isEdit
      ? await supabase.from("contacts").update(payload).eq("id", contact.id)
      : await supabase.from("contacts").insert({ ...payload, source_categories: [] });

    setIsSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isEdit ? "Contact updated." : "Contact added.");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit contact" : "Add contact"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Business title *">
            <input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={values.phone_raw}
                onChange={(e) => update("phone_raw", e.target.value)}
                placeholder="+1 415 555 2671"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Country code (ISO-2)">
              <input
                value={values.country_code}
                onChange={(e) => update("country_code", e.target.value.toUpperCase())}
                placeholder="US"
                maxLength={2}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Website">
            <input
              value={values.website}
              onChange={(e) => update("website", e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Street">
            <input
              value={values.street}
              onChange={(e) => update("street", e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>
            <Field label="State">
              <input
                value={values.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Category">
            <input
              value={values.category_name}
              onChange={(e) => update("category_name", e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Status">
            <select
              value={values.status}
              onChange={(e) => update("status", e.target.value as ContactStatus)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              {CONTACT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CONTACT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes">
            <textarea
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.do_not_contact}
              onChange={(e) => update("do_not_contact", e.target.checked)}
            />
            Do not contact
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
