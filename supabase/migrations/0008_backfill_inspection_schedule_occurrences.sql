-- Backfill occurrence history for submissions created before occurrence tracking.
-- Cancelled dates are generated from each asset's AMC start through the
-- submission date; completed dates are then linked to their submissions.
insert into inspection_schedule_occurrences (
  equipment_id,
  scheduled_date,
  status,
  cancelled_at
)
select distinct
  e.id,
  scheduled_date::date,
  'cancelled',
  now()
from equipment e
join form_submissions s on s.equipment_id = e.id
join maintenance_frequencies f
  on lower(f.code) = lower(e.amc_frequency)
  or lower(f.label) = lower(e.amc_frequency)
cross join lateral generate_series(
  coalesce(e.amc_date, s.inspection_date),
  s.inspection_date - 1,
  make_interval(days => f.interval_days)
) as scheduled_date
where f.interval_days is not null
on conflict (equipment_id, scheduled_date) do nothing;

insert into inspection_schedule_occurrences (
  equipment_id,
  scheduled_date,
  status,
  submission_id,
  completed_at
)
select
  s.equipment_id,
  s.inspection_date,
  'completed',
  s.id,
  coalesce(s.submitted_at, now())
from form_submissions s
where s.equipment_id is not null
on conflict (equipment_id, scheduled_date) do update
set status = 'completed',
    submission_id = excluded.submission_id,
    completed_at = excluded.completed_at,
    cancelled_at = null;
