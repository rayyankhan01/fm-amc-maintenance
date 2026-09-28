create table maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references form_responses(id) on delete cascade,
  equipment_id uuid not null references equipment(id),
  status text not null default 'open',        -- 'open' | 'resolved'
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution_comment text
);