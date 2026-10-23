create or replace function public.populate_inspection_schedule_occurrences()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  asset record;
  period_start date;
  due_date date;
  submission_id uuid;
  submission_date date;
  submission_timestamp timestamptz;
  latest_completed_date date;
  today_uae date := (now() at time zone 'Asia/Dubai')::date;
begin
  insert into inspection_schedule_occurrences (
    equipment_id,
    scheduled_date,
    status,
    submission_id,
    completed_at
  )
  select distinct on (s.equipment_id, s.inspection_date)
    s.equipment_id,
    s.inspection_date,
    'completed',
    s.id,
    coalesce(s.submitted_at, now())
  from form_submissions s
  where s.equipment_id is not null
    and exists (
      select 1
      from form_responses r
      where r.submission_id = s.id
    )
  order by s.equipment_id, s.inspection_date, s.submitted_at desc
  on conflict (equipment_id, scheduled_date) do update
  set status = 'completed',
      submission_id = excluded.submission_id,
      completed_at = excluded.completed_at,
      cancelled_at = null;

  for asset in
    select
      e.id,
      e.amc_date,
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
    due_date := asset.next_amc_date;
    select max(s.inspection_date)
    into latest_completed_date
    from form_submissions s
    where s.equipment_id = asset.id
      and exists (
        select 1
        from form_responses r
        where r.submission_id = s.id
      );


    period_start := coalesce(
      asset.amc_date - 1,
      due_date - asset.interval_days - 1
    );
    if latest_completed_date is not null
      and latest_completed_date >= due_date - asset.interval_days then
      period_start := latest_completed_date;
    end if;

    while due_date < today_uae loop
      submission_id := null;
      submission_date := null;
      submission_timestamp := null;

      select s.id, s.inspection_date, s.submitted_at
      into submission_id, submission_date, submission_timestamp
      from form_submissions s
      where s.equipment_id = asset.id
        and s.inspection_date > period_start
        and s.inspection_date <= due_date
        and exists (
          select 1
          from form_responses r
          where r.submission_id = s.id
        )
      order by s.inspection_date, s.submitted_at
      limit 1;

      if submission_id is not null then
        period_start := submission_date;
        due_date := submission_date + asset.interval_days;
      else
        insert into inspection_schedule_occurrences (
          equipment_id,
          scheduled_date,
          status,
          cancelled_at
        )
        values (
          asset.id,
          due_date,
          'cancelled',
          now()
        )
        on conflict (equipment_id, scheduled_date) do update
        set status = 'cancelled',
            cancelled_at = coalesce(inspection_schedule_occurrences.cancelled_at, excluded.cancelled_at)
        where inspection_schedule_occurrences.status <> 'completed';

        period_start := due_date;
        due_date := due_date + asset.interval_days;
      end if;
    end loop;

    insert into inspection_schedule_occurrences (
      equipment_id,
      scheduled_date,
      status
    )
    values (
      asset.id,
      due_date,
      'pending'
    )
    on conflict (equipment_id, scheduled_date) do update
    set status = 'pending',
        cancelled_at = null
    where inspection_schedule_occurrences.status <> 'completed';

    update equipment
    set next_amc_date = due_date
    where id = asset.id
      and next_amc_date is distinct from due_date;
  end loop;
end;
$$;

revoke all on function public.populate_inspection_schedule_occurrences() from public;
grant execute on function public.populate_inspection_schedule_occurrences() to service_role;

create extension if not exists pg_cron with schema extensions;


select cron.unschedule(jobid)
from cron.job
where jobname in (
  'backfill-inspection-schedule-occurrences',
  'populate-inspection-schedule-occurrences'
);

select cron.schedule(
  'populate-inspection-schedule-occurrences',
  '5 20 * * *',
  $$select public.populate_inspection_schedule_occurrences();$$
);
