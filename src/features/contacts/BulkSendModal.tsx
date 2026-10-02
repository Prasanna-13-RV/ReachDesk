import { useState } from "react";
import type { Contact } from "@/types/domain";

interface BulkSendModalProps {
  contacts: Contact[];
  /** Opens WhatsApp for the contact; returns whether it actually opened. */
  onSend: (contact: Contact) => boolean;
  onClose: () => void;
}

/**
 * WhatsApp has no public API for free-form automated sending — wa.me links only
 * prefill a chat, the user still taps "Send" themselves (this is intentional
 * anti-spam behavior on WhatsApp's side). This modal makes that manual step as
 * fast as possible: click through the selected contacts one by one.
 */
export function BulkSendModal({ contacts, onSend, onClose }: BulkSendModalProps) {
  const [index, setIndex] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  const isDone = index >= contacts.length;
  const current = contacts[index];

  function handleSendCurrent() {
    if (!current) return;
    if (onSend(current)) setSentCount((n) => n + 1);
    setIndex((i) => i + 1);
  }

  function handleSkip() {
    setIndex((i) => i + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Bulk send</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          WhatsApp requires a manual tap to send each message, so this opens every selected
          contact's chat prefilled with your template — just click through the list.
        </p>

        {!isDone && current ? (
          <div className="mt-4 rounded-md border border-border p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">
              Contact {index + 1} of {contacts.length}
            </div>
            <div className="mt-1 font-medium">{current.title}</div>
            <div className="text-muted-foreground">
              {current.phone_normalized ?? current.phone_raw}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-border p-3 text-sm">
            Done — opened {sentCount} of {contacts.length} chats.
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            {isDone ? "Close" : "Stop"}
          </button>
          {!isDone && (
            <>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSendCurrent}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Open WhatsApp &amp; next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
