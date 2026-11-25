begin;

create or replace function normalize_site_code()
returns trigger
language plpgsql
as $$
begin
  new.site_code := upper(trim(new.site_code));
  return new;
end;
$$;

drop trigger if exists locations_normalize_site_code on locations;

create trigger locations_normalize_site_code
  before insert or update on locations
  for each row
  execute function normalize_site_code();

alter table locations
  add constraint locations_site_code_format
  check (site_code ~ '^[A-Z0-9-]+$');

commit;