-- Migration to add bookings, payments, and reviews tables matching DiNOMAD business requirements.

create extension if not exists "btree_gist";

create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.payment_method as enum ('vietqr', 'momo', 'zalopay', 'card');
create type public.payment_status as enum ('pending', 'successful', 'failed', 'refunded');

-- 1. Bookings Table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete restrict, -- Restricted deletion to prevent financial data loss
  customer_id uuid not null references public.profiles (id) on delete restrict, -- Restricted deletion to prevent financial data loss
  booking_date date not null default current_date,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'pending',
  price_per_hour integer not null, -- snapshot of the price at the time of booking
  subtotal integer not null, -- price_per_hour * hours
  platform_fee integer not null, -- 10% of subtotal
  total_amount integer not null, -- subtotal + platform_fee
  qr_code_token text unique, -- Token for scanning check-in
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure end time is after start time
  constraint bookings_start_end_time_check check (start_time < end_time),
  
  -- Ensure total amount calculations are correct
  constraint bookings_amount_positive check (total_amount >= 0),
  
  -- Enforce 30-minute block boundaries for booking slots
  constraint bookings_time_alignment_check check (
    extract(minute from start_time) in (0, 30) and
    extract(second from start_time) = 0 and
    extract(minute from end_time) in (0, 30) and
    extract(second from end_time) = 0
  )
);

-- Index for fast status and range queries
create index bookings_room_id_idx on public.bookings (room_id);
create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_time_range_idx on public.bookings (start_time, end_time);

-- Prevent overlapping bookings at the database level for the same room (excluding cancelled bookings)
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  room_id with =,
  tstzrange(start_time, end_time) with &&
) where (status != 'cancelled');

-- 2. Payments Table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict, -- Restricted deletion to protect payment history
  payment_method public.payment_method not null,
  transaction_id text,
  amount integer not null,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_booking_id_idx on public.payments (booking_id);
create index payments_status_idx on public.payments (status);

-- 3. Reviews Table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  rating integer not null constraint reviews_rating_check check (rating between 1 and 5),
  comment text,
  comment_vi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_room_id_idx on public.reviews (room_id);
create index reviews_rating_idx on public.reviews (rating);

-- Triggers for updated_at
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Enable Row Level Security (RLS)
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- RLS Policies for Bookings
create policy "Users can read own bookings"
on public.bookings for select
to authenticated
using (customer_id = auth.uid() or public.is_admin());

create policy "Customers can create bookings"
on public.bookings for insert
to authenticated
with check (customer_id = auth.uid());

create policy "Suppliers can read bookings of their rooms"
on public.bookings for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = bookings.room_id
      and public.is_supplier_member(v.supplier_id)
  )
);

create policy "Admins can manage all bookings"
on public.bookings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS Policies for Payments
create policy "Users can read own payments"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    where b.id = payments.booking_id
      and b.customer_id = auth.uid()
  ) or public.is_admin()
);

create policy "Suppliers can read payments for their rooms"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.bookings b
    join public.rooms r on r.id = b.room_id
    join public.venues v on v.id = r.venue_id
    where b.id = payments.booking_id
      and public.is_supplier_member(v.supplier_id)
  )
);

create policy "Admins can manage all payments"
on public.payments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- RLS Policies for Reviews
create policy "Reviews are public for active rooms"
on public.reviews for select
to anon, authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.venues v on v.id = r.venue_id
    where r.id = reviews.room_id
      and r.status = 'published'
      and v.status = 'published'
  )
);

create policy "Customers can create reviews for their completed bookings"
on public.reviews for insert
to authenticated
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.bookings b
    where b.id = reviews.booking_id
      and b.customer_id = auth.uid()
      and b.status = 'completed'
  )
);

create policy "Customers can update their own reviews"
on public.reviews for update
to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create policy "Admins can manage all reviews"
on public.reviews for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
