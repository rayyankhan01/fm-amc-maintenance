alter table equipment
  add column if not exists refill_date_co2 date,
  add column if not exists expire_date_co2 date generated always as ((refill_date_co2 + interval '1 year')::date) stored,
  add column if not exists refill_date_dcp date,
  add column if not exists expire_date_dcp date generated always as ((refill_date_dcp + interval '1 year')::date) stored;