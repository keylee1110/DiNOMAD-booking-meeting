-- Migration: add venue operating hours for slot computation
--
-- The backend computes available slots from open_time → close_time.
-- Without these columns, slotsLeftToday defaults to 10 (arbitrary).

alter table public.venues
  add column open_time  time not null default '07:00',
  add column close_time time not null default '22:00';
