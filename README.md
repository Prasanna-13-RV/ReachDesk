# ReachDesk

Import business leads from Excel, organize them, and reach out over WhatsApp —
without ever auto-sending a message.

See [docs/ReachDesk_Technical_Functional_Requirements.md](docs/ReachDesk_Technical_Functional_Requirements.md)
for the full spec, and [docs/decisions.md](docs/decisions.md) for how ambiguities in that
spec were resolved in this implementation.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Zustand (auth state), Zod (validation), react-router-dom
- `xlsx` for in-browser spreadsheet parsing, `libphonenumber-js` for phone normalization
- Vitest + Testing Library

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Supabase](https://supabase.com) project, then run the SQL files in
   [supabase/migrations](supabase/migrations) against it, in order, via the Supabase SQL editor
   or the Supabase CLI:

   ```bash
   supabase db push
   ```

3. Copy `.env.example` to `.env` and fill in your project's values:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```

   These are the public/browser-safe keys — never put the service-role key here.

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

```
src/
  app/            # Router
  components/     # Shared layout
  features/       # One folder per feature (auth, contacts, imports, templates, campaigns, whatsapp, settings, dashboard)
  lib/            # Framework-agnostic logic: Excel parsing/mapping, phone normalization, template engine, validation, Supabase client
  stores/         # Zustand stores
  types/          # Database (Supabase) types and domain types/constants
supabase/
  migrations/     # SQL schema, applied in filename order
docs/
  ReachDesk_Technical_Functional_Requirements.md   # Product spec
  decisions.md                                     # Resolved spec ambiguities
```

## Core features

- **Import** (`features/imports`): upload an `.xlsx` file (all sheets are read and merged),
  auto-map columns, validate/normalize phone numbers, detect duplicates (both within the file
  and against your existing contacts), and see exactly which rows were rejected and why.
- **Contacts** (`features/contacts`): searchable table with manual add/edit, one-click status
  changes, per-contact WhatsApp action, and delete.
- **Templates** (`features/templates`): reusable message templates with `{{placeholder}}`
  support (case-insensitive; see `lib/templates/renderTemplate.ts` for the supported keys).
- **Campaigns** (`features/campaigns`): named outreach batches (create/list today; contact
  assignment is not yet wired up — see `docs/decisions.md`/open TODOs).
- **WhatsApp** (`features/whatsapp`): builds a `wa.me` deep link from a contact + rendered
  template and opens it in a new tab. Never sends automatically, and message-event logging is
  best-effort (it never blocks opening WhatsApp).

## Notes

- Row Level Security is enabled on every table — all data is scoped to `auth.uid()`.
- `src/types/database.ts` is a hand-written mirror of the SQL migrations. If you have the
  Supabase CLI, you can regenerate it instead:

  ```bash
  supabase gen types typescript --project-id <project-ref> > src/types/database.ts
  ```
