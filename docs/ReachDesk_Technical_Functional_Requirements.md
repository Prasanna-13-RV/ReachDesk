**ReachDesk**

**Technical & Functional Requirements Specification**

Version 1.0 • React + Vite + TypeScript + Supabase

*\
Import contacts • Organize campaigns • Prepare personalized WhatsApp
messages • Open wa.me manually*

# 1. Executive Summary

ReachDesk is a web application for importing business/contact data from
Excel, organizing that data into campaigns, generating personalized
message drafts, and opening a WhatsApp conversation for the selected
phone number. The user remains in control of the final WhatsApp action:
ReachDesk copies/prepares the message and opens the wa.me link; the user
reviews, edits if desired, and presses Send in WhatsApp.

Version 1 will use React + Vite + TypeScript on the frontend and
Supabase for authentication, PostgreSQL data storage, and optional file
storage. No custom backend server is required for the MVP.

# 2. Product Vision

Tagline: Import. Organize. Reach out.

ReachDesk should feel like a lightweight outreach workspace rather than
an Excel viewer. It should make a large contact list understandable,
searchable, actionable, and trackable while avoiding automated WhatsApp
sending.

# 3. Goals

-   Import structured Excel contact data with minimal manual cleanup.

-   Normalize and validate phone numbers before a WhatsApp action is
    offered.

-   Provide searchable, filterable, sortable contact views.

-   Support reusable message templates with contact-field placeholders.

-   Generate a personalized message preview for each contact.

-   Copy the generated message and open the corresponding wa.me link.

-   Track local/application statuses such as Pending, Contacted,
    Replied, Follow-up, and Do Not Contact.

-   Support campaigns so the same contact list can be used in organized
    outreach workflows.

-   Persist data securely using Supabase with per-user access control.

-   Keep the architecture ready for future features without requiring a
    custom backend server in V1.

# 4. Non-Goals / Out of Scope for V1

-   Automatic WhatsApp message sending.

-   WhatsApp Web browser automation or simulated clicks.

-   Automatic reading or scraping of WhatsApp conversations.

-   Automatic reply detection from WhatsApp.

-   Bulk automated sending.

-   A custom backend API server.

-   Multi-channel messaging such as SMS/email unless added in a later
    phase.

-   Advanced CRM features such as deal pipelines and invoicing.

# 5. Target Users

  -----------------------------------------------------------------------
  **User**                            **Needs**
  ----------------------------------- -----------------------------------
  Owner / Sales user                  Upload contacts, search prospects,
                                      prepare messages, open WhatsApp,
                                      track outcomes.

  Small sales team member             Work from assigned contacts and
                                      maintain consistent
                                      statuses/templates.

  Administrator                       Manage users, templates, campaigns,
                                      and application configuration in
                                      later phases.
  -----------------------------------------------------------------------

# 6. High-Level User Journey

-   Sign in to ReachDesk.

-   Create or select a campaign.

-   Upload an .xlsx file.

-   Map Excel columns to ReachDesk fields if needed.

-   Preview records and validation results.

-   Import valid records.

-   Search/filter contacts.

-   Open a contact detail or quick-action panel.

-   Select a message template.

-   Preview the personalized message.

-   Copy the message.

-   Open WhatsApp using wa.me/\<international-number\>.

-   User reviews/edits and manually sends in WhatsApp.

-   Return to ReachDesk and update the contact status/notes.

# 7. Functional Requirements

## FR-001 Authentication

-   Users shall be able to sign up and sign in using Supabase
    Authentication.

-   Users shall only access their own contacts, campaigns, templates,
    and message history.

-   Users shall be able to sign out.

-   Password reset/recovery shall be supported if email/password
    authentication is enabled.

## FR-002 Excel Upload

-   The application shall accept .xlsx files in the browser.

-   The initial import shall support the supplied columns: title,
    totalScore, reviewsCount, street, city, state, countryCode, website,
    phone, categories/0 through categories/9, url, categoryName.

-   The user shall see file name, record count, and detected columns
    before import.

-   The system shall reject unsupported file types with a clear error.

-   The system shall not silently discard rows.

## FR-003 Column Mapping

-   The importer shall attempt automatic mapping by normalized column
    name.

-   The user shall be able to manually map unmatched columns.

-   Unknown columns may be retained as optional metadata or ignored with
    explicit confirmation.

-   The mapping configuration should be reusable for later uploads.

## FR-004 Validation & Normalization

-   Phone numbers shall be normalized to an international format where
    sufficient country information exists.

-   Invalid or ambiguous phone numbers shall be flagged rather than
    silently converted.

-   Duplicate phone numbers within an import shall be detected.

-   Rows missing a phone number shall remain visible in the validation
    report but shall not expose a WhatsApp action.

-   Required field validation shall occur before database import.

## FR-005 Contact Management

-   Contacts shall be searchable by business title, phone, city, state,
    website, and category.

-   Contacts shall support filtering by status, city, category,
    campaign, and validity.

-   Contacts shall support sorting by title, score, review count, city,
    status, and updated date.

-   Users shall be able to view a contact detail panel.

-   Users shall be able to edit supported contact fields.

-   Users shall be able to archive a contact.

-   Users shall be able to mark a contact as Do Not Contact.

## FR-006 Message Templates

-   Users shall be able to create, edit, duplicate, and archive
    templates.

-   Templates shall support placeholders such as {{title}}, {{city}},
    {{categoryName}}, and {{website}}.

-   The application shall preview the resolved message before copying
    it.

-   Missing placeholder values shall be clearly indicated.

-   Templates shall be associated with a user and optionally a campaign.

## FR-007 WhatsApp Preparation

-   The application shall generate a wa.me URL from a validated
    international phone number.

-   The application shall copy the generated message to the clipboard.

-   The application shall open the wa.me URL in a new browser tab/window
    when permitted by the browser.

-   The application shall not automatically press Send in WhatsApp.

-   The user shall be able to edit the generated message before manually
    sending it in WhatsApp.

-   The application shall record when the user selected the WhatsApp
    preparation action.

## FR-008 Contact Status & Notes

-   Supported statuses shall include Pending, Prepared, Contacted,
    Replied, Follow-up, Not Interested, and Do Not Contact.

-   Users shall be able to add internal notes.

-   Status changes shall include a timestamp.

-   Do Not Contact shall prevent the normal WhatsApp action unless the
    user explicitly overrides it in a future permissioned workflow.

## FR-009 Campaigns

-   Users shall be able to create, rename, archive, and view campaigns.

-   Contacts may be associated with one or more campaigns.

-   A campaign shall have a name, description, template, status, and
    timestamps.

-   Campaign views shall show basic contact counts by status.

## FR-010 Dashboard

-   The dashboard shall show total contacts, pending contacts, contacted
    contacts, replies, follow-ups, and Do Not Contact counts.

-   Dashboard metrics shall be filterable by campaign where practical.

-   The dashboard shall provide quick navigation to recent or pending
    contacts.

## FR-011 Import History

-   The system shall retain an import record containing file name,
    import time, user, total rows, imported rows, rejected rows, and
    duplicate count.

-   Users shall be able to review import errors.

-   Import history shall not expose data belonging to another user.

## FR-012 Export

-   Users shall be able to export their filtered contact data to .xlsx
    or CSV in a later V1.x release.

-   Exported data shall preserve supported contact fields and status.

# 8. Non-Functional Requirements

  -----------------------------------------------------------------------
  **ID**                              **Requirement**
  ----------------------------------- -----------------------------------
  NFR-001                             Security: all Supabase data access
                                      must be protected by Row Level
                                      Security.

  NFR-002                             Privacy: uploaded contact data
                                      should not be exposed publicly.

  NFR-003                             Performance: initial contact table
                                      should remain responsive for at
                                      least 10,000 imported rows;
                                      virtualization/pagination should be
                                      used as needed.

  NFR-004                             Usability: primary contact actions
                                      should be reachable within one or
                                      two clicks.

  NFR-005                             Accessibility: keyboard navigation,
                                      visible focus states, semantic
                                      labels, and adequate contrast shall
                                      be supported.

  NFR-006                             Reliability: import failures shall
                                      be recoverable without corrupting
                                      existing contacts.

  NFR-007                             Browser support: current Chrome,
                                      Edge, Firefox, and Safari versions
                                      should be targeted.

  NFR-008                             Maintainability: application code
                                      shall use TypeScript, modular
                                      components, typed data models, and
                                      feature-oriented folders.

  NFR-009                             Scalability: the data model shall
                                      permit migration to a custom
                                      API/backend later.
  -----------------------------------------------------------------------

# 9. System Architecture

Recommended architecture:

Browser → React/Vite application → Supabase JS client → Supabase
Auth/PostgreSQL/Storage. WhatsApp is outside the application boundary
and is reached through a user-initiated wa.me URL.

No custom Node.js/Python API is required in V1.

Data flow for import:

-   User selects .xlsx file.

-   SheetJS parses workbook in browser memory.

-   Column mapping and validation run in the browser.

-   User reviews the validation summary.

-   Valid records are inserted into Supabase in batches.

-   Import log is written to Supabase.

-   The UI refreshes contact/campaign counts.

Data flow for WhatsApp preparation:

-   User selects contact.

-   Application resolves template placeholders.

-   Application validates phone number.

-   Application writes an optional preparation event.

-   Application copies message to clipboard.

-   Application opens wa.me/\<number\>.

-   User manually reviews and sends through WhatsApp.

# 10. Technology Stack

  -----------------------------------------------------------------------
  **Layer**               **Technology**          **Purpose**
  ----------------------- ----------------------- -----------------------
  UI                      React + Vite            SPA and build tooling

  Language                TypeScript              Type safety and
                                                  maintainability

  Styling                 Tailwind CSS            Consistent responsive
                                                  UI

  Components              shadcn/ui               Reusable accessible UI
                                                  primitives

  Icons                   Lucide React            Interface icons

  Excel                   SheetJS (xlsx)          Browser-side workbook
                                                  parsing/export

  State                   Zustand                 Lightweight application
                                                  state

  Validation              Zod                     Runtime schema
                                                  validation

  Backend platform        Supabase                Auth, database,
                                                  storage, APIs

  Database                PostgreSQL              Contacts, campaigns,
                                                  templates, history

  Hosting                 Vercel / Netlify /      Static frontend
                          Cloudflare Pages        deployment

  Version control         Git + GitHub/GitLab     Source control and
                                                  collaboration
  -----------------------------------------------------------------------

# 11. Database Design

Core tables recommended for V1:

  -----------------------------------------------------------------------
  **Table**               **Key fields**          **Purpose**
  ----------------------- ----------------------- -----------------------
  profiles                id, name, created_at    Application user
                                                  profile

  contacts                id, user_id, title,     Business/contact
                          phone, city, state,     records
                          website, category_name, 
                          status                  

  contact_categories      contact_id, category_id Optional normalized
                                                  category relationships

  categories              id, user_id, name       Reusable category
                                                  catalog

  campaigns               id, user_id, name,      Outreach campaigns
                          description,            
                          template_id, status     

  campaign_contacts       campaign_id, contact_id Many-to-many campaign
                                                  membership

  message_templates       id, user_id, name,      Reusable message
                          content, status         templates

  message_events          id, user_id,            Audit/history of
                          contact_id,             preparation actions
                          campaign_id,            
                          event_type,             
                          message_snapshot,       
                          created_at              

  imports                 id, user_id, file_name, Import audit
                          row_count,              
                          imported_count,         
                          rejected_count,         
                          duplicate_count,        
                          created_at              

  import_errors           id, import_id,          Validation/import
                          row_number, field,      errors
                          error_message           
  -----------------------------------------------------------------------

## 12. Contact Data Model

The original Excel structure should be preserved during import, but the
application model should use clearer field names.

  -----------------------------------------------------------------------
  **Excel Column**                    **Application Field**
  ----------------------------------- -----------------------------------
  title                               title

  totalScore                          total_score

  reviewsCount                        reviews_count

  street                              street

  city                                city

  state                               state

  countryCode                         country_code

  website                             website

  phone                               phone_raw / phone_normalized

  categories/0\...9                   source_categories or normalized
                                      categories

  url                                 source_url

  categoryName                        category_name
  -----------------------------------------------------------------------

# 13. Security & Privacy

-   Enable Supabase Row Level Security on every user-owned table.

-   Use authenticated user ID as the ownership boundary.

-   Never expose the Supabase service-role key in the frontend.

-   Only the publishable/anon client key intended for browser use should
    be embedded in the application.

-   Use HTTPS in production.

-   Do not log raw phone numbers or message content unnecessarily in
    browser console or external analytics.

-   Provide a clear deletion/archive mechanism for contact data.

-   Treat uploaded business/contact data as potentially sensitive and
    restrict access accordingly.

# 14. WhatsApp / Messaging Compliance Boundary

ReachDesk V1 is a message-preparation tool, not a WhatsApp sending API.
The application must not automate clicking Send, scrape WhatsApp Web,
bypass WhatsApp controls, or attempt to evade platform restrictions.
Users are responsible for having an appropriate basis/consent for
outreach and for complying with applicable laws and WhatsApp policies.

# 15. UI / UX Specification

  -----------------------------------------------------------------------
  **Screen**                          **Primary functions**
  ----------------------------------- -----------------------------------
  Login                               Sign in, sign up, password recovery

  Dashboard                           KPIs, campaign summaries, pending
                                      actions, recent activity

  Contacts                            Table, search, filter, sort,
                                      pagination, quick actions

  Contact Detail                      Business details, message preview,
                                      status, notes, history

  Import                              Upload, mapping, validation
                                      preview, import confirmation

  Campaigns                           Create/manage campaigns,
                                      membership, status metrics

  Templates                           Create/edit templates, placeholder
                                      helper, preview

  Settings                            Profile, preferences, future
                                      integrations
  -----------------------------------------------------------------------

# 16. Component Structure

src/\
app/\
components/\
ui/\
layout/\
contacts/\
campaigns/\
templates/\
imports/\
dashboard/\
features/\
auth/\
contacts/\
campaigns/\
templates/\
imports/\
whatsapp/\
lib/\
supabase/\
excel/\
phone/\
templates/\
validation/\
stores/\
hooks/\
types/\
pages/\
routes/\
utils/

# 17. Message Template Engine

Supported syntax in V1:

{{title}} {{city}} {{state}} {{categoryName}} {{website}} {{phone}}

Example:

Hi {{title}},\
\
I came across your business in {{city}}. We help {{categoryName}}
businesses with \[SERVICE\].\
\
Would you be interested in learning more?

The engine should render a preview without changing the stored template.
Escaping and missing values must be handled safely.

# 18. WhatsApp URL Rules

-   Use the normalized international number without +, spaces, brackets,
    or hyphens in the wa.me path.

-   Do not include an invalid/unknown phone number in a WhatsApp action.

-   Optionally support a prefilled text parameter only if the product
    team confirms it is desirable and compatible with the intended
    workflow.

-   The user must remain responsible for the final send action.

# 19. Acceptance Criteria

AC-001: A user can sign in and sees only their own data.

AC-002: A user can upload the supplied Excel format and see a preview
before import.

AC-003: The importer identifies the expected columns and reports
missing/unmapped fields.

AC-004: Invalid phone numbers are flagged and cannot trigger a normal
WhatsApp action.

AC-005: A valid contact can be searched and filtered.

AC-006: A user can create a template containing placeholders.

AC-007: A contact-specific message preview resolves placeholders
correctly.

AC-008: Clicking Copy places the resolved message into the browser
clipboard.

AC-009: Clicking Open WhatsApp opens the correct wa.me URL in a new
tab/window where the browser permits it.

AC-010: No automated Send action exists in V1.

AC-011: A user can change a contact\'s status and add notes.

AC-012: A campaign can be created and contacts assigned to it.

AC-013: Dashboard counters reflect stored statuses.

AC-014: Row Level Security prevents cross-user data access.

AC-015: An import log records counts and errors.

# 20. Testing Strategy

-   Unit tests for phone normalization, template rendering, Excel
    mapping, validation, and status transitions.

-   Component tests for contact table, filters, template editor, import
    preview, and contact actions.

-   Integration tests for Supabase queries and Row Level Security.

-   End-to-end tests for login → import → search → prepare message →
    status update.

-   Manual browser testing for wa.me navigation and clipboard
    permissions.

-   Large-file testing using 10,000+ rows to verify acceptable UI
    responsiveness.

-   Security testing to verify a user cannot query another user\'s rows.

# 21. Performance Strategy

-   Parse Excel in the browser without blocking the main UI; use Web
    Workers if file size becomes significant.

-   Use table virtualization for large contact lists.

-   Paginate Supabase queries.

-   Debounce search input.

-   Batch database inserts during import.

-   Avoid unnecessary realtime subscriptions in V1.

-   Cache campaign/template data locally where appropriate.

# 22. Deployment

-   Create a production Supabase project.

-   Configure authentication redirect URLs.

-   Configure database tables, indexes, RLS policies, and migrations.

-   Build the Vite application with production environment variables.

-   Deploy the static frontend to Vercel, Netlify, or Cloudflare Pages.

-   Configure the production domain and HTTPS.

-   Never commit secrets to Git.

# 23. Development Phases

  -----------------------------------------------------------------------
  **Phase**                           **Deliverables**
  ----------------------------------- -----------------------------------
  Phase 0                             Repository, Vite/React/TypeScript
                                      setup, linting, formatting,
                                      environment configuration

  Phase 1                             Supabase project, Auth, database
                                      schema, RLS

  Phase 2                             Excel upload, column mapping,
                                      validation, preview

  Phase 3                             Contacts table, search, filter,
                                      sort, contact detail

  Phase 4                             Templates and placeholder engine

  Phase 5                             Copy message + wa.me workflow +
                                      contact statuses

  Phase 6                             Campaigns and dashboard analytics

  Phase 7                             Testing, performance, security
                                      hardening

  Phase 8                             Production deployment and
                                      documentation
  -----------------------------------------------------------------------

# 24. Future Roadmap

-   Team/workspace support.

-   Role-based access control.

-   Advanced import mappings.

-   CSV export and campaign reporting.

-   Follow-up reminders.

-   Email/SMS integrations.

-   Official WhatsApp Business Platform integration where appropriate.

-   Webhook-driven message status and reply workflows if an official
    messaging integration is added.

-   CRM pipeline and lead scoring.

-   Advanced analytics and reporting.

-   Custom backend/API only if business requirements eventually justify
    it.

# 25. Risks & Mitigations

  -----------------------------------------------------------------------
  **Risk**                            **Mitigation**
  ----------------------------------- -----------------------------------
  Large Excel files freeze browser    Web Worker, chunked parsing, row
                                      limits, virtualization

  Invalid phone numbers               Normalization + validation +
                                      explicit error state

  Duplicate contacts                  Normalized phone uniqueness per
                                      user plus duplicate report

  Data leakage                        Supabase RLS, no service key in
                                      frontend, security testing

  Browser blocks new tab              Use user-initiated click and
                                      provide fallback link

  Clipboard permission failure        Show message and allow manual copy

  WhatsApp changes behavior           Keep WhatsApp integration limited
                                      to documented wa.me navigation

  Future need for automation          Keep WhatsApp logic behind a
                                      service interface so an official
                                      API adapter can be added later
  -----------------------------------------------------------------------

# 26. Definition of Done for V1

-   All V1 functional requirements are implemented.

-   All acceptance criteria pass.

-   RLS is tested for cross-user isolation.

-   Excel import works with the provided schema.

-   Phone normalization and validation have automated tests.

-   Message templates render correctly.

-   WhatsApp preparation opens the intended wa.me destination without
    automated sending.

-   The application is responsive on desktop and tablet widths.

-   Production deployment is documented.

-   Environment variables and Supabase setup are documented.

-   Known limitations are documented.

# 27. Implementation Notes

The project should be designed around clear domain boundaries: imports,
contacts, campaigns, templates, and WhatsApp preparation. Keep Supabase
calls in a dedicated data-access layer rather than scattering database
queries across UI components. This will make a future custom backend or
official WhatsApp integration easier to introduce.

# 28. Suggested Initial Repository

reachdesk/\
public/\
src/\
app/\
components/\
features/\
auth/\
contacts/\
imports/\
campaigns/\
templates/\
whatsapp/\
hooks/\
lib/\
excel/\
phone/\
supabase/\
templates/\
validation/\
pages/\
stores/\
types/\
utils/\
supabase/\
migrations/\
seed/\
tests/\
unit/\
integration/\
e2e/\
.env.example\
package.json\
vite.config.ts\
tsconfig.json\
README.md

# 29. Environment Variables

Vite frontend should use only browser-safe Supabase configuration.
Example names:

VITE_SUPABASE_URL\
VITE_SUPABASE_ANON_KEY

Do not place SUPABASE_SERVICE_ROLE_KEY or any server secret in the Vite
frontend.

# 30. Final Architecture Decision

Approved baseline architecture for ReachDesk V1: React + Vite +
TypeScript frontend, Tailwind/shadcn UI, SheetJS for browser-side Excel
processing, Zustand for client state, Zod for validation, and Supabase
for authentication and PostgreSQL persistence. No custom backend server
is required. WhatsApp interaction is limited to user-initiated wa.me
navigation and manual message sending.

**End of ReachDesk Technical & Functional Requirements Specification**
