alter table locations
  alter column room_area drop not null;

drop index if exists locations_site_name_room_unique;

create unique index locations_site_name_room_unique
  on locations (
    (lower(trim(site_code))),
    (lower(trim(coalesce(site_name, '')))),
    (lower(trim(coalesce(room_area, ''))))
  );