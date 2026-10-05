-- Track whether an equipment asset was created through the technician Quick Add flow.
alter table equipment
  add column if not exists is_submitted_by_tech boolean not null default false;
