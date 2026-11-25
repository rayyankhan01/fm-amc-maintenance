create table public.equipment_import_batches (
  batch_no integer generated always as identity primary key,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.equipment_import_batches enable row level security;

revoke all on table public.equipment_import_batches from public, anon, authenticated;
grant select, insert on table public.equipment_import_batches to service_role;
grant usage, select on sequence public.equipment_import_batches_batch_no_seq to service_role;

alter table public.equipment
  add column import_batch_no integer references public.equipment_import_batches(batch_no);

create index equipment_import_batch_no_idx on public.equipment (import_batch_no)
  where import_batch_no is not null;