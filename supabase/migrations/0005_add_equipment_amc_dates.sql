-- Store the configured AMC date and the next date calculated from its frequency.
alter table equipment
  add column if not exists amc_date date,
  add column if not exists next_amc_date date;
