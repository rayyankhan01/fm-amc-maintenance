# FM AMC Maintenance Checklist System — Project Context

## What this is
An internal tool for Seven Spikes' Facilities Management (FM) department to
digitize their paper AMC (Annual Maintenance Contract) inspection checklists.
Built by Rayyan (Junior Developer, small software department).

Source spec: SRS_FM_AMCMaintenance.docx — covers 6 equipment types (AC, Smoke
Detector, Fire Extinguisher, Fire Hose Reel, Fire Pump & Water Tank,
Electrical System), each with its own checklist. Full system also includes
equipment/asset management, scheduling, reports, and role-based access.

## Current milestone
**MVP**: one working checklist (AC inspection) end-to-end — technician logs
in, picks equipment, fills the checklist, signs, submits, data is stored.
No admin UI yet (AC template is hand-seeded via SQL, already run in
Supabase). No scheduling/due-list yet. No reports yet. This is intentionally
a thin vertical slice to demo to the FM department before building out the
rest.

**Phase 1 (post-MVP, 2-3 week target)**: equipment/asset management,
equipment categorization, admin-built inspection templates (a generic
template builder — the same engine the MVP uses, exposed as an admin UI),
technician inspection flow (already built in MVP).

## Key design decision: generic form engine, not per-equipment-type code
FM confirmed forms won't stay AMC-only — general forms will follow later.
So the system is built around **"form" as the core concept**, not
"checklist." One generic form renderer reads a template's fields (from the
DB) and displays whatever it's given — checklist items (OK/N_OK/Remarks) or
header inputs (text/date/select), distinguished by `field_type`. Adding a
new equipment type or form type later means inserting data, not writing new
UI code. Do not build equipment-specific form components (no
`ACChecklistForm.jsx` — only `ChecklistForm.jsx`, generic).

## Stack
- **Language**: plain JavaScript, not TypeScript (deliberate choice —
  Rayyan is more fluent in JS; revisit converting to TS after the MVP is
  demoed, once there's less time pressure). Use JSDoc `@typedef` comments in
  place of `.ts` type files where useful, mainly in `api.js` files.
- **Frontend**: Next.js (App Router, JS, Material UI), hosted on Vercel
  (~$20/mo Pro seat). Originally built with Tailwind; switched to MUI after
  seeing the MVP UI, to match the look of Rayyan's other internal project
  (QR document management). Styling setup: `app/ThemeRegistry.jsx` wraps the
  root layout with MUI's `AppRouterCacheProvider` + `ThemeProvider` +
  `CssBaseline` (needed for correct SSR with the App Router). No Tailwind
  packages/config remain in the repo.
- **Backend**: Supabase — Postgres, Auth, Storage. **Must be under a Seven
  Spikes-owned account**, not a personal one (migration in progress as of
  this writing — check before assuming it's done)
- Same backend stack as Rayyan's other internal project (QR document
  management), kept consistent on purpose. That project's login also
  authenticates by a synthetic email built from a staff/employee ID (not a
  real email) — this project follows the same pattern (`emp_id` ->
  `<emp_id>@sevenspikes.internal`, lowercased) so both tools behave the same
  way for users. See `app/(auth)/login/page.jsx`.

## Schema (see supabase/migrations/0001_init_schema.sql — already run)
9 tables:
1. `locations` — site_code, site_name, room_area (single location field per
   FM feedback — no separate building/floor)
2. `equipment` — asset master. `equipment_type_code` + `unit_number` unique
   together (numbering restarts per equipment type, confirmed by FM). No
   stored composite asset_id string — compose it for display from
   site_code/equipment_type_code/unit_number instead of storing/parsing it.
3. `asset_movements` — location change history, separate from
   `equipment.location_id` (which always reflects current location)
4. `form_templates` — one row per form type, tied to `equipment_type`
5. `form_fields` — field definitions for a template (checklist_item / text /
   date / select), with section grouping + sort_order + is_mandatory
6. `profiles` — extends `auth.users` (same `id`, not a separate generated
   UUID — 1-to-1 extension pattern). `emp_role` is a Postgres enum:
   admin/manager/engineer/technician
7. `form_submissions` — one row per completed form (technician, equipment,
   date, signatures)
8. `form_responses` — one row per field per submission (the actual answers)

**RLS is OFF on all tables currently** — deliberate for fast dev/demo
speed. Must be enabled with real policies (e.g. technicians can only
select/insert their own `form_submissions`) before any real technician
login touches this. Not yet done — do not treat as done.

## RBAC — important distinction, don't conflate with folder structure
Role-based access is enforced by (a) `profiles.emp_role`, (b) RLS policies
on Supabase tables, and (c) role checks in app code (`lib/auth.js`) — NOT
by which route-group folders happen to exist in `app/`. The repo currently
only has a `(technician)` route group because that's the only flow being
built right now; this does not mean RBAC is being skipped. Even the
technician-only MVP should check `emp_role = 'technician'` before allowing
submission, and RLS on `form_submissions` should restrict a technician to
their own rows. **`lib/auth.js` (role-check helper) and the RLS policy on
`form_submissions` are an outstanding task, not yet built** — do before
treating the technician flow as done, and definitely before any other role
touches the system.

`(admin)` and `(staff)` route groups are planned but intentionally not
scaffolded yet — they'll be created when those features are actually built,
informed by having finished the technician flow first, same way
`asset_movements` was designed only after `equipment` was already built.

## Known open items / deferred decisions
- `equipment_type` / `equipment_type_code` are still free text (not a
  lookup table). Fine for AC-only MVP; should become a proper
  `equipment_types` table before the admin template-builder ships, so
  admins manage types via UI instead of typing text that must match
  exactly across `equipment` and `form_templates`.
- No generic `audit_log` table yet — undecided whether `asset_movements` +
  `form_submissions.submitted_at` is sufficient audit trail per SRS §17, or
  whether a dedicated log table is needed.
- Scheduling / "due & overdue inspections" list (SRS-confirmed in-scope,
  technician's main screen per FM sketch) — not yet designed into the
  schema. Will need a next-due-date concept on `equipment` derived from
  `amc_frequency` + last inspection date.
- FM approval workflow is explicitly OUT of scope (confirmed — no
  "Approvals" screen in the SRS's current screen list).
- Displayed asset ID (`SRC/W3/SPAC/191`) vs stored ID (`SRC/SPAC/191`):
  whether the displayed ID should update if equipment moves sites, or
  freeze at first registration, is an open business question for FM — not
  yet decided.
- TypeScript conversion — deferred, not rejected. Revisit once MVP is
  demoed and there's breathing room; easier to convert a working,
  understood JS codebase than to learn TS while also designing the app.

## Project structure
Feature-based, not layer-based. Routes in `app/` stay thin; real logic
(types, queries, components) lives grouped by domain under `features/`
(e.g. `features/forms/`). Build folders as needed, not all upfront —
currently only `(technician)` and `features/forms/` exist, matching what's
actually being built.

```
fm-amc-system/
├── app/
│   ├── (auth)/login/page.jsx
│   ├── (technician)/
│   │   ├── layout.jsx
│   │   └── inspections/
│   │       ├── page.jsx            # equipment picker (MVP)
│   │       └── [id]/page.jsx       # the checklist form
│   ├── layout.jsx
│   └── page.jsx
├── features/
│   └── forms/
│       ├── api.js                  # getTemplate, submitInspection...
│       ├── types.js                # JSDoc @typedef definitions
│       └── components/
│           ├── ChecklistForm.jsx   # the generic renderer
│           ├── ChecklistItemField.jsx
│           └── SignaturePad.jsx
├── lib/
│   ├── supabase/
│   │   ├── client.js
│   │   └── server.js
│   └── auth.js                     # role-check helper — NOT YET BUILT
├── supabase/
│   └── migrations/0001_init_schema.sql   # already run
├── .env.local                       # gitignored
├── .gitignore
├── CLAUDE.md
└── README.md
```

## Immediate next steps (in order)
1. `lib/auth.js` — role-check helper + RLS policy on `form_submissions`
   (flagged above as outstanding, do before/alongside the rest)
2. `lib/supabase/client.js` — connect to Supabase using env vars
3. `features/forms/types.js` — JSDoc typedefs for FormTemplate, FormField,
   FormSubmission, FormResponse
4. `features/forms/api.js` — `getTemplateWithFields(templateId)` and
   `submitInspection(data)`
5. `ChecklistForm.jsx` — fetch template, render fields, collect answers,
   submit

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
