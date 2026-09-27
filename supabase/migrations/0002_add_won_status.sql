-- Adds a "won" contact status (business requirement: one-click "Got project"
-- outcome, in addition to the 7-value set from FR-008).

alter table public.contacts
  drop constraint if exists contacts_status_check;

alter table public.contacts
  add constraint contacts_status_check
  check (status in (
    'pending', 'prepared', 'contacted', 'replied',
    'follow_up', 'not_interested', 'do_not_contact', 'won'
  ));
