alter table equipment
  add column if not exists asset_id text;

update equipment e
set asset_id = concat(l.site_code, '/', e.equipment_type_code, '/', e.unit_number)
from locations l
where e.location_id = l.id
  and (e.asset_id is null or e.asset_id = '');

create unique index if not exists equipment_asset_id_unique
  on equipment (asset_id)
  where asset_id is not null;
