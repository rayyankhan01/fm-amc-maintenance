create or replace function public.import_equipment_batch(p_created_by uuid, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  asset jsonb;
  location_values jsonb;
  location_id uuid;
  batch_no integer;
  unit_no integer;
  generated_asset_id text;
  results jsonb := '[]'::jsonb;
  error_code text;
  error_message text;
  error_detail text;
  error_hint text;
begin
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'Import rows must be an array.';
  end if;
  if jsonb_array_length(p_rows) < 1 then
    raise exception 'Import batches must contain at least 1 row.';
  end if;

  lock table public.locations, public.equipment in share row exclusive mode;
  insert into public.equipment_import_batches (created_by)
    values (p_created_by) returning equipment_import_batches.batch_no into batch_no;

  for item in select value from jsonb_array_elements(p_rows) loop
    asset := item->'values';
    location_values := item->'location';
    begin
      if exists (
        select 1 from public.locations loc
        where (upper(trim(loc.site_code)) = location_values->>'site_code'
               and lower(trim(coalesce(loc.site_name, '-'))) <> lower(trim(location_values->>'site_name')))
           or (lower(trim(coalesce(loc.site_name, '-'))) = lower(trim(location_values->>'site_name'))
               and upper(trim(loc.site_code)) <> location_values->>'site_code')
      ) then
        raise exception 'Site configuration for [%] has conflicting site names or codes.', location_values->>'site_code';
      end if;

      select loc.id into location_id from public.locations loc
      where lower(trim(loc.site_code)) = lower(trim(location_values->>'site_code'))
        and lower(trim(coalesce(loc.site_name, ''))) = lower(trim(location_values->>'site_name'))
        and lower(trim(coalesce(loc.room_area, ''))) = lower(trim(location_values->>'room_area'))
      limit 1;

      if location_id is null then
        insert into public.locations (site_code, site_name, room_area)
          values (location_values->>'site_code', location_values->>'site_name', location_values->>'room_area')
          returning id into location_id;
      end if;

      select coalesce(max(eq.unit_number), 0) + 1 into unit_no
      from public.equipment eq where eq.equipment_type_code = asset->>'equipment_type_code';
      generated_asset_id := concat(location_values->>'site_code', '/', asset->>'equipment_type_code', '/', unit_no);
      if exists (
        select 1 from public.equipment eq
        where (upper(trim(eq.equipment_type_code)) = upper(trim(asset->>'equipment_type_code')) and eq.unit_number = unit_no)
           or upper(trim(eq.asset_id)) = upper(generated_asset_id)
      ) then
        raise exception 'Unable to assign unique Asset ID [%]. Please retry the import.', generated_asset_id;
      end if;

      insert into public.equipment (
        equipment_type_id, equipment_type, equipment_type_code, unit_number, name,
        status, amc_frequency, amc_date, next_amc_date, refill_date_co2, refill_date_dcp,
        capacity_type, asset_id, location_id, import_batch_no
      ) values (
        (asset->>'equipment_type_id')::uuid, asset->>'equipment_type', asset->>'equipment_type_code', unit_no, asset->>'name',
        asset->>'status', asset->>'amc_frequency', (asset->>'amc_date')::date, (asset->>'next_amc_date')::date,
        nullif(asset->>'refill_date_co2', '')::date, nullif(asset->>'refill_date_dcp', '')::date,
        asset->>'capacity_type', generated_asset_id, location_id, batch_no
      );
      results := results || jsonb_build_array(jsonb_build_object('row', (item->>'row')::integer, 'status', 'Imported', 'message', generated_asset_id));
    exception when others then
      get stacked diagnostics error_code = returned_sqlstate, error_message = message_text,
        error_detail = pg_exception_detail, error_hint = pg_exception_hint;
      raise exception using errcode = error_code,
        message = format('Row %s, Asset Name [%s]: %s', item->>'row', asset->>'name', error_message),
        detail = coalesce(error_detail, ''), hint = coalesce(error_hint, '');
    end;
  end loop;
  return results;
end;
$$;

revoke all on function public.import_equipment_batch(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.import_equipment_batch(uuid, jsonb) to service_role;