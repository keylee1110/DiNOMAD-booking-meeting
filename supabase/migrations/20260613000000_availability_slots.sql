-- Migration: availability_slots + venue operating hours
-- Pre-generated 30-minute time slots per room per day.
-- Status flow: available → held (checkout timer) → booked → occupied
-- Partners can also mark slots as blocked (walk-in / maintenance).
-- Operating hours stored on venues — enforced in backend, not DB constraint.

-- ─── 1. Add operating hours to venues ────────────────────────────────────────
-- Defaults to 07:00–22:00 for existing rows.
-- Backend uses these when generating slots for a room.

alter table public.venues
  add column open_time  time not null default '07:00',
  add column close_time time not null default '22:00',
  add constraint venues_hours_check check (close_time > open_time);

-- ─── 2. slot_status enum ─────────────────────────────────────────────────────

create type public.slot_status as enum (
  'available',
  'held',       -- locked by checkout timer, not yet paid
  'booked',     -- payment confirmed
  'occupied',   -- guest has checked in
  'blocked'     -- partner manually blocked (walk-in / maintenance)
);

-- ─── 3. availability_slots table ─────────────────────────────────────────────

create table public.availability_slots (
  id             uuid        primary key default gen_random_uuid(),
  room_id        uuid        not null references public.rooms (id) on delete cascade,
  date           date        not null,
  start_time     time        not null,  -- e.g. 09:00
  end_time       time        not null,  -- e.g. 09:30  (always start + 30 min)
  status         public.slot_status not null default 'available',
  booking_id     uuid        references public.bookings (id) on delete set null,
  blocked_by     uuid        references public.profiles (id) on delete set null,
  blocked_reason text,                  -- 'walk_in' | 'maintenance' | 'private_event'
  held_until     timestamptz,           -- checkout timer expiry; null when not held
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- One slot per room per day per start time — no duplicates
  constraint availability_slots_unique unique (room_id, date, start_time),

  -- end_time must always be exactly 30 minutes after start_time
  constraint availability_slots_duration_check check (
    end_time = (start_time + interval '30 minutes')::time
  ),

  -- booking_id only set when status is booked or occupied
  constraint availability_slots_booking_consistency check (
    (status in ('booked', 'occupied') and booking_id is not null)
    or
    (status not in ('booked', 'occupied'))
  )
);

-- ─── 4. Indexes ───────────────────────────────────────────────────────────────

-- Fast lookup: all slots for a room on a given date (guest booking flow)
create index availability_slots_room_date_idx
  on public.availability_slots (room_id, date);

-- Fast lookup: available slots across a date range (search results)
create index availability_slots_status_date_idx
  on public.availability_slots (status, date);

-- Fast lookup: held slots that have expired (background cleanup job)
create index availability_slots_held_until_idx
  on public.availability_slots (held_until)
  where status = 'held';

-- ─── 5. updated_at trigger ───────────────────────────────────────────────────

create or replace function public.update_availability_slot_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger availability_slots_updated_at
  before update on public.availability_slots
  for each row execute function public.update_availability_slot_timestamp();

-- ─── 6. Slot generation function ─────────────────────────────────────────────
-- Called by backend when a room is published (or when operating hours change).
-- Reads open_time / close_time from venues via the room's venue_id.
-- Generates 30-min slots for each day in the range.
-- ON CONFLICT DO NOTHING — safe to call multiple times (idempotent).

create or replace function public.generate_slots_for_room(
  p_room_id   uuid,
  p_from_date date default current_date,
  p_days      int  default 30
)
returns void language plpgsql as $$
declare
  v_open_time  time;
  v_close_time time;
  v_date       date;
  v_start      time;
begin
  -- Look up operating hours from the venue this room belongs to
  select v.open_time, v.close_time
  into   v_open_time, v_close_time
  from   public.rooms r
  join   public.venues v on v.id = r.venue_id
  where  r.id = p_room_id;

  if not found then
    raise exception 'Room % not found', p_room_id;
  end if;

  for i in 0 .. (p_days - 1) loop
    v_date  := p_from_date + i;
    v_start := v_open_time;

    while v_start < v_close_time loop
      insert into public.availability_slots (room_id, date, start_time, end_time)
      values (p_room_id, v_date, v_start, (v_start + interval '30 minutes')::time)
      on conflict (room_id, date, start_time) do nothing;

      v_start := (v_start + interval '30 minutes')::time;
    end loop;
  end loop;
end;
$$;

-- ─── 7. Expired-hold release function ────────────────────────────────────────
-- Frees slots whose checkout timer expired before payment completed.
-- Call on a schedule (cron) or at the start of every slot-fetch request.

create or replace function public.release_expired_holds()
returns int language plpgsql as $$
declare
  v_count int;
begin
  update public.availability_slots
  set    status = 'available', held_until = null, booking_id = null
  where  status = 'held'
    and  held_until < now();

  get diagnostics v_count = row_count;
  return v_count;  -- number of slots released (useful for logging)
end;
$$;

-- ─── 8. RLS ──────────────────────────────────────────────────────────────────

alter table public.availability_slots enable row level security;

-- Anyone (guests, unauthenticated) can read slots — needed for room booking page
create policy "availability_slots_read_public"
  on public.availability_slots for select
  using (true);

-- All writes go through the NestJS backend with the service role key (bypasses RLS)
