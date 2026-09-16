-- Admin configuration foundation.
-- Auth users remain in Supabase Auth; profiles stores application identity and role.

create table if not exists equipment_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table equipment_types
  add column if not exists is_active boolean not null default true;

alter table equipment add column if not exists equipment_type_id uuid;

insert into equipment_types (code, name)
select distinct equipment_type, equipment_type
from equipment
where equipment_type is not null
on conflict (code) do nothing;

update equipment e
set equipment_type_id = t.id
from equipment_types t
where e.equipment_type_id is null
  and t.code = e.equipment_type;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'equipment_equipment_type_id_fkey') then
    alter table equipment add constraint equipment_equipment_type_id_fkey
      foreign key (equipment_type_id) references equipment_types(id);
  end if;
end $$;

alter table form_templates add column if not exists equipment_type_id uuid;

insert into equipment_types (code, name)
select distinct equipment_type, equipment_type
from form_templates
where equipment_type is not null
on conflict (code) do nothing;

update form_templates f
set equipment_type_id = t.id
from equipment_types t
where f.equipment_type_id is null
  and t.code = f.equipment_type;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'form_templates_equipment_type_id_fkey') then
    alter table form_templates add constraint form_templates_equipment_type_id_fkey
      foreign key (equipment_type_id) references equipment_types(id);
  end if;
end $$;

create table if not exists status_values (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists maintenance_frequencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  interval_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint maintenance_frequencies_interval_check
    check (interval_days is null or interval_days > 0)
);

create table if not exists permissions (
  code text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  role user_role not null,
  permission_code text not null references permissions(code) on delete cascade,
  primary key (role, permission_code)
);

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into status_values (code, label, sort_order)
values ('OPERATIONAL', 'Operational', 1), ('NOT_OPERATIONAL', 'Not Operational', 2)
on conflict (code) do nothing;

insert into maintenance_frequencies (code, label, interval_days)
values
  ('DAILY', 'Daily', 1),
  ('WEEKLY', 'Weekly', 7),
  ('MONTHLY', 'Monthly', 30),
  ('QUARTERLY', 'Quarterly', 90),
  ('YEARLY', 'Yearly', 365)
on conflict (code) do nothing;

insert into permissions (code, label)
values
  ('users.manage', 'Manage users'),
  ('roles.manage', 'Manage roles and permissions'),
  ('equipment_types.manage', 'Manage equipment categories'),
  ('templates.manage', 'Manage inspection templates'),
  ('statuses.manage', 'Manage status values'),
  ('frequencies.manage', 'Manage maintenance frequencies'),
  ('reports.view', 'View and export reports'),
  ('settings.manage', 'Manage system settings')
on conflict (code) do nothing;

insert into role_permissions (role, permission_code)
select 'admin'::user_role, code from permissions
on conflict do nothing;

insert into role_permissions (role, permission_code)
values ('manager'::user_role, 'templates.manage'), ('manager'::user_role, 'reports.view')
on conflict do nothing;

create unique index if not exists locations_site_room_unique
  on locations (site_code, room_area);

create unique index if not exists profiles_emp_id_unique
  on profiles (lower(emp_id));
