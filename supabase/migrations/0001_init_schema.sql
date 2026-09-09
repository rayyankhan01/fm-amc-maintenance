-- ============================================================
-- AMC Preventive Maintenance Management System
-- MVP Schema: Locations, Equipment, Movements, Generic Form Engine
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. LOCATIONS ---------------------------------------------------
-- Real table (not free text) so movements can reference stable places.
create table locations (
  id uuid primary key default gen_random_uuid(),
  site_code text not null,                -- 'W3'
  site_name text,                         -- optional full name
  room_area text not null,                -- 'Office 204' -- single field, per FM feedback
  created_at timestamptz default now()
);

-- 2. EQUIPMENT -----------------------------------------------------
-- Master record for every asset. unit_number restarts per equipment
-- type, so uniqueness is on the (type_code, unit_number) combination.
create table equipment (
  id uuid primary key default gen_random_uuid(),
  equipment_type_code text not null,      -- 'SPAC' -- used in the displayed asset ID
  equipment_type text not null,           -- 'AC' -- drives form_templates matching
  unit_number int not null,               -- 191
  name text,                              -- 'Split AC Unit - Office 204'
  location_id uuid references locations(id),
  status text default 'Operational',      -- Operational / Not Operational
  amc_frequency text,                     -- Daily/Weekly/.../Custom
  created_at timestamptz default now(),
  unique (equipment_type_code, unit_number)
);

-- 3. ASSET MOVEMENTS -------------------------------------------------
-- History log of equipment relocations, separate from equipment's
-- current location_id (which always reflects "now").
create table asset_movements (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id),
  from_location_id uuid references locations(id),   -- nullable: first-ever placement
  to_location_id uuid not null references locations(id),
  moved_at timestamptz default now(),
  moved_by uuid references auth.users(id),
  notes text
);

-- 4. FORM TEMPLATES ----------------------------------------------
-- One row per form type (AC Inspection, Smoke Detector Inspection, etc.)
create table form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,                     -- 'AC Inspection Checklist'
  equipment_type text not null,           -- must match equipment.equipment_type
  created_at timestamptz default now()
);

-- 5. FORM FIELDS ---------------------------------------------------
-- Definition of each field on a template: either a checklist item
-- (OK/N_OK/Remarks) or a header input (text/date/select).
create table form_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references form_templates(id) on delete cascade,
  field_type text not null default 'checklist_item', -- 'checklist_item' | 'text' | 'date' | 'select'
  section text,                           -- e.g. 'Condensing Unit' (nullable for header fields)
  label text not null,                    -- checkpoint description or field label
  sort_order int not null default 0,
  is_mandatory boolean default true
);

-- 6. FORM SUBMISSIONS -----------------------------------------------
-- One row per technician's completed form.
create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references form_templates(id),
  equipment_id uuid references equipment(id),    -- nullable: future non-asset forms
  technician_id uuid references auth.users(id),
  inspection_date date not null default current_date,
  technician_signature text,              -- base64 or storage URL
  supervisor_signature text,
  submitted_at timestamptz default now()
);

-- 7. FORM RESPONSES ---------------------------------------------------
-- One row per field per submission = the actual answers.
create table form_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references form_submissions(id) on delete cascade,
  field_id uuid not null references form_fields(id),
  result text,                            -- 'OK' | 'N_OK' | 'N_A' (for checklist_item fields)
  value text,                             -- free text (for text/date/select fields)
  remarks text                            -- required in app logic when result = 'N_OK'
);

create type user_role as enum ('admin', 'manager', 'engineer', 'technician');

create table profiles (
     id uuid primary key references auth.users(id),
    name text not null,
    emp_id text not null,
    emp_role user_role not null
);

create table asset_movements(
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id),
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  moved_at timestamptz default now(),
  notes text

);