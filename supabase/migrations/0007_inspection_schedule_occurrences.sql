-- Persist each expected AMC inspection occurrence so completed and cancelled
-- history remains available after equipment.next_amc_date advances.
create table if not exists inspection_schedule_occurrences (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  scheduled_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  submission_id uuid references form_submissions(id) on delete set null,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  unique (equipment_id, scheduled_date)
);

create index if not exists inspection_schedule_occurrences_equipment_date_idx
  on inspection_schedule_occurrences (equipment_id, scheduled_date);

create index if not exists inspection_schedule_occurrences_status_idx
  on inspection_schedule_occurrences (status);
