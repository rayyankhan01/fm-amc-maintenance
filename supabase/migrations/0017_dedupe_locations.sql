-- Remove duplicate locations (same site + site name + room, ignoring case/spaces).
-- Keeps the oldest row per group, moves equipment and movement history onto it,
-- then enforces uniqueness. 0002's index never got created in prod, and its key
-- (site_code, room_area) would have blocked multiple sites under one area.

begin;

-- Map every duplicate row to the row we keep (oldest in its group)
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
                 lower(trim(room_area))
    order by created_at asc, id asc
  )
) ranked
where rn > 1;

-- Move references from duplicates onto the kept row
update equipment e
set location_id = d.keep_id
from location_dupes d
where e.location_id = d.duplicate_id;

update asset_movements m
set from_location_id = d.keep_id
from location_dupes d
where m.from_location_id = d.duplicate_id;

update asset_movements m
set to_location_id = d.keep_id
from location_dupes d
where m.to_location_id = d.duplicate_id;

-- Remove the duplicates
delete from locations
where id in (select duplicate_id from location_dupes);

-- Enforce uniqueness from now on
drop index if exists locations_site_room_unique;

create unique index locations_site_name_room_unique
  on locations (
    (lower(trim(site_code))),
    (lower(trim(coalesce(site_name, '')))),
    (lower(trim(room_area)))
  );

commit;