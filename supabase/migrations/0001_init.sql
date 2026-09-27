-- ReachDesk V1 initial schema
-- Design notes (see docs/ReachDesk_Technical_Functional_Requirements.md and
-- docs/decisions.md for the assumptions/conflicts this schema resolves):
--   * Categories are stored as a JSON array column (contacts.source_categories)
--     instead of normalized categories/contact_categories tables (FR simplification).
--   * Contact status uses the full 7-value set from FR-008.
--   * Duplicate phone numbers per user are hard-blocked via a partial unique index.
--   * column_mappings persists reusable Excel column mapping config per user (FR-003),
--     since the spec did not define a table for it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: shadow table for auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are self-writable" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shared updated_at maintenance trigger function, used by several tables below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- message_templates (campaign_id FK added after campaigns table exists)
-- ---------------------------------------------------------------------------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid,
  name text not null,
  content text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_templates_user_id_idx on public.message_templates (user_id);

alter table public.message_templates enable row level security;

create policy "Templates are user scoped" on public.message_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  template_id uuid references public.message_templates (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);

alter table public.campaigns enable row level security;

create policy "Campaigns are user scoped" on public.campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.message_templates
  add constraint message_templates_campaign_id_fkey
  foreign key (campaign_id) references public.campaigns (id) on delete set null;

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Excel-sourced fields (see docs section 12 for the Excel -> field mapping)
  title text not null,
  total_score numeric,
  reviews_count integer,
  street text,
  city text,
  state text,
  country_code text,
  website text,
  phone_raw text,
  phone_normalized text,
  phone_valid boolean not null default false,
  source_categories jsonb not null default '[]'::jsonb,
  category_name text,
  source_url text,

  -- application fields
  status text not null default 'pending'
    check (status in (
      'pending', 'prepared', 'contacted', 'replied',
      'follow_up', 'not_interested', 'do_not_contact'
    )),
  notes text,
  is_archived boolean not null default false,
  do_not_contact boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_status_idx on public.contacts (user_id, status);
create index if not exists contacts_city_idx on public.contacts (user_id, city);
create index if not exists contacts_category_idx on public.contacts (user_id, category_name);

create extension if not exists "pg_trgm";

create index if not exists contacts_title_trgm_idx on public.contacts using gin (title gin_trgm_ops);

-- Hard-block duplicate phone numbers per user (rows with a null phone are exempt).
create unique index if not exists contacts_user_phone_unique_idx
  on public.contacts (user_id, phone_normalized)
  where phone_normalized is not null;

alter table public.contacts enable row level security;

create policy "Contacts are user scoped" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- campaign_contacts (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_contacts (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (campaign_id, contact_id)
);

alter table public.campaign_contacts enable row level security;

create policy "Campaign contacts are owner scoped" on public.campaign_contacts
  for all using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_contacts.campaign_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_contacts.campaign_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- message_events (audit trail of WhatsApp preparation actions)
-- ---------------------------------------------------------------------------
create table if not exists public.message_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  template_id uuid references public.message_templates (id) on delete set null,
  event_type text not null check (event_type in ('prepared', 'copied', 'opened_whatsapp')),
  message_snapshot text not null,
  phone_used text not null,
  created_at timestamptz not null default now()
);

create index if not exists message_events_user_id_idx on public.message_events (user_id);
create index if not exists message_events_contact_id_idx on public.message_events (contact_id);

alter table public.message_events enable row level security;

create policy "Message events are user scoped" on public.message_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- imports + import_errors (import audit log)
-- ---------------------------------------------------------------------------
create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  rejected_count integer not null default 0,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists imports_user_id_idx on public.imports (user_id);

alter table public.imports enable row level security;

create policy "Imports are user scoped" on public.imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports (id) on delete cascade,
  row_number integer not null,
  field text,
  error_message text not null
);

create index if not exists import_errors_import_id_idx on public.import_errors (import_id);

alter table public.import_errors enable row level security;

create policy "Import errors are owner scoped" on public.import_errors
  for all using (
    exists (
      select 1 from public.imports i
      where i.id = import_errors.import_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.imports i
      where i.id = import_errors.import_id and i.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- column_mappings (reusable Excel column mapping config, FR-003)
-- ---------------------------------------------------------------------------
create table if not exists public.column_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  mapping jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists column_mappings_user_id_idx on public.column_mappings (user_id);

alter table public.column_mappings enable row level security;

create policy "Column mappings are user scoped" on public.column_mappings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_column_mappings_updated_at
  before update on public.column_mappings
  for each row execute procedure public.set_updated_at();

create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row execute procedure public.set_updated_at();

create trigger set_message_templates_updated_at
  before update on public.message_templates
  for each row execute procedure public.set_updated_at();
