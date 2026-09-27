# Design decisions & spec conflict resolutions

`docs/ReachDesk_Technical_Functional_Requirements.md` has a few ambiguities/conflicts.
This records how the implementation resolves each one.

1. **Contact status set** — FR-008 lists 7 statuses (Pending, Prepared, Contacted, Replied,
   Follow-up, Not Interested, Do Not Contact), but §3 Goals / FR-010 Dashboard only mention 5.
   **Resolved:** implemented the full 7-value set from FR-008; the dashboard groups by all 7.

2. **Categories storage** — §12 maps `categories/0..9` columns to "source categories or
   normalized categories," and §11 lists optional `categories`/`contact_categories` join tables.
   **Resolved:** stored as a single `jsonb` array column (`contacts.source_categories`) plus a
   flattened `category_name` (first category) for simple filtering/indexing, instead of
   normalized join tables. Revisit if category-level reporting becomes a requirement.

3. **Message-event logging** — FR-007 says the app "shall record" the WhatsApp prep action;
   §9 calls the same event "optional." **Resolved:** logging is best-effort — writing to
   `message_events` never blocks opening WhatsApp (failures are swallowed/logged, not surfaced
   as an error to the user).

4. **Column mapping persistence** — FR-003 says the Excel column mapping "should be reusable,"
   but no table is defined for it. **Resolved:** added a `column_mappings` table (per-user, named
   JSON mapping configs) so it works across devices instead of relying on `localStorage`.

5. **Duplicate phone handling** — FR-004 only requires duplicates to be "detected" (soft), but
   the data model implies per-user uniqueness. **Resolved:** hard-blocked via a partial unique
   index on `(user_id, phone_normalized) where phone_normalized is not null`. Rows with an
   invalid/missing phone are exempt from the constraint and are imported with `phone_valid = false`.

6. **Status set extended with "won"** — not in the original spec's 7-value set (FR-008), but
   added (migration `0002_add_won_status.sql`) so contacts can be one-click marked as
   "Got Project" from the Contacts table, alongside "Message Sent" (contacted) and "Got Reply"
   (replied) quick actions.
