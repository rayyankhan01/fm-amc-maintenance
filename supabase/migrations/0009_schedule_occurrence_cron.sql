create or replace function public.backfill_inspection_schedule_occurrences()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  asset record;
  next_due date;
  today_uae date := (now() at time zone 'Asia/Dubai')::date;
begin
  for asset in
    select
      e.id,
      e.next_amc_date,
      f.interval_days
    from equipment e
    join maintenance_frequencies f
      on lower(f.code) = lower(e.amc_frequency)
      or lower(f.label) = lower(e.amc_frequency)
    where e.next_amc_date is not null
      and f.interval_days is not null
      and f.interval_days > 0
  loop
    next_due := asset.next_amc_date;

    while next_due < today_uae loop
      insert into inspection_schedule_occurrences (
        equipment_id,
        scheduled_date,
        status,
        cancelled_at
      )
      values (
        asset.id,
        next_due,
        'cancelled',
        now()
      )
      on conflict (equipment_id, scheduled_date) do nothing;

      next_due := next_due + asset.interval_days;
    end loop;

    if next_due = today_uae then
      insert into inspection_schedule_occurrences (
        equipment_id,
        scheduled_date,
        status
      )
      values (
        asset.id,
        next_due,
        'pending'
      )
      on conflict (equipment_id, scheduled_date) do nothing;
    end if;

    if next_due <> asset.next_amc_date then
      update equipment
      set next_amc_date = next_due
      where id = asset.id;
    end if;
  end loop;
end;
$$;

revoke all on function public.backfill_inspection_schedule_occurrences() from public;
grant execute on function public.backfill_inspection_schedule_occurrences() to service_role;

create extension if not exists pg_cron with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'backfill-inspection-schedule-occurrences';

select cron.schedule(
  'backfill-inspection-schedule-occurrences',
  '5 20 * * *',
  $$select public.backfill_inspection_schedule_occurrences();$$
);
