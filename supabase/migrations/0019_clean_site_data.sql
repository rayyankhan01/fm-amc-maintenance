begin;
create temp table test_locations on commit drop as
select id from locations
where site_name = 'Test Yard' or upper(trim(site_code)) = 'TEST SITE';

create temp table test_equipment on commit drop as
select id from equipment where location_id in (select id from test_locations);

delete from maintenance_issues where equipment_id in (select id from test_equipment);
delete from form_submissions   where equipment_id in (select id from test_equipment); -- responses cascade
delete from asset_movements
where equipment_id in (select id from test_equipment)
   or from_location_id in (select id from test_locations)
   or to_location_id   in (select id from test_locations);
delete from equipment where id in (select id from test_equipment);                    -- schedule rows cascade
delete from locations where id in (select id from test_locations);

drop index if exists locations_site_name_room_unique;

update locations set site_code = 'WARSAN', site_name = 'Al Warsan Site Office'
where upper(trim(site_code)) in ('WARSAN', 'SOC-01');

update locations set site_code = 'JAFZA', site_name = 'JAFZA'
where upper(trim(site_code)) = 'JAFZA';

update locations set site_code = 'LC', site_name = 'Labour City Site Office'
where upper(trim(site_code)) = 'LC';

update locations set site_code = 'KH'
where trim(site_code) = 'SR-26/1';

update locations set site_code = upper(trim(site_code))
where site_code <> upper(trim(site_code));

create temp table location_dupes on commit drop as
select id as duplicate_id, keep_id
from (
  select id,
         first_value(id) over w as keep_id,
         row_number()    over w as rn
  from locations
  window w as (
    partition by lower(trim(site_code)),
                 lower(trim(coalesce(site_name, ''))),
                 lower(trim(coalesce(room_area, '')))
    order by created_at asc, id asc
  )
) ranked
where rn > 1;

update equipment e set location_id = d.keep_id
from location_dupes d where e.location_id = d.duplicate_id;

update asset_movements m set from_location_id = d.keep_id
from location_dupes d where m.from_location_id = d.duplicate_id;

update asset_movements m set to_location_id = d.keep_id
from location_dupes d where m.to_location_id = d.duplicate_id;

delete from locations where id in (select duplicate_id from location_dupes);

create unique index locations_site_name_room_unique
  on locations (
    (lower(trim(site_code))),
    (lower(trim(coalesce(site_name, '')))),
    (lower(trim(coalesce(room_area, ''))))
  );

select site_code, site_name, count(*) as rooms
from locations group by site_code, site_name order by site_code;
commit;