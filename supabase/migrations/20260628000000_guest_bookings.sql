-- Allow booking without a registered account (guest checkout).
-- Guests must supply name + phone (+ optionally email) instead of an auth profile.

alter table public.bookings
  alter column customer_id drop not null;

alter table public.bookings
  add column guest_name text,
  add column guest_phone text,
  add column guest_email text;

-- Every booking must belong to either a registered customer or a guest with contact info.
alter table public.bookings
  add constraint bookings_customer_or_guest_check
  check (customer_id is not null or (guest_name is not null and guest_phone is not null));

-- Guests (no auth session) can create their own bookings when contact info is supplied.
-- Mirrors "Customers can create bookings" but for the anon role with customer_id left null.
create policy "Guests can create bookings"
on public.bookings for insert
to anon
with check (
  customer_id is null
  and guest_name is not null
  and guest_phone is not null
);
