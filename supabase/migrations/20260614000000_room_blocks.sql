-- Migration: replace pre-generated availability_slots with sparse room_blocks
--
-- Why: pre-generating 30 slots × 30 days per room creates ~900 rows/room
-- that are never touched. Most slots are available — only store exceptions.
--
-- New model:
--   Available slots  = computed on-demand from venues.open_time / close_time
--   Blocked slots    = stored in room_blocks (partner walk-in / maintenance)
--   Booked slots     = derived from bookings table (existing GiST no-overlap)
--   Held slots       = will be added to bookings flow when guest checkout lands

-- ─── 1. Drop old pre-generation objects ───────────────────────────────────────

drop table if exists public.availability_slots cascade;
drop type  if exists public.slot_status cascade;
drop function if exists public.generate_slots_for_room cascade;
drop function if exists public.release_expired_holds cascade;
drop function if exists public.update_availability_slot_timestamp cascade;

-- ─── 2. room_blocks — sparse table, only exceptions ──────────────────────────

create table public.room_blocks (
  id          uuid        primary key default gen_random_uuid(),
  room_id     uuid        not null references public.rooms (id) on delete cascade,
  date        date        not null,
  start_time  time        not null,   -- "09:00"
  end_time    time        not null,   -- "09:30"  (always start + 30 min)
  reason      text,                   -- 'manual' | 'walk_in' | 'maintenance' | 'private_event'
  blocked_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),

  -- One block per room per day per start time — prevents duplicates
  constraint room_blocks_unique unique (room_id, date, start_time),

  -- end_time must always be exactly 30 minutes after start_time
  constraint room_blocks_duration_check check (
    end_time = (start_time + interval '30 minutes')::time
  )
);

create index room_blocks_room_date_idx on public.room_blocks (room_id, date);

-- ─── 3. RLS ───────────────────────────────────────────────────────────────────

alter table public.room_blocks enable row level security;

-- Public read (guests need to see what's blocked when booking)
create policy "room_blocks_read_public"
  on public.room_blocks for select
  using (true);

-- All writes via NestJS backend with service role key (bypasses RLS)
