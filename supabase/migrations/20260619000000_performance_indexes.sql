-- Performance optimization: add composite indexes for common query patterns
-- and fix potential booking insert issues.

-- 1. Composite index for public rooms listing (landing page & search page)
-- Covers: status filter + created_at sort in a single index scan
create index if not exists rooms_status_created_idx
  on public.rooms (status, created_at desc)
  where status = 'published';

-- 2. Composite index for venue status filter in rooms queries
create index if not exists venues_status_idx
  on public.venues (status)
  where status = 'published';

-- 3. Composite index for customer bookings history
create index if not exists bookings_customer_created_idx
  on public.bookings (customer_id, created_at desc);

-- 4. Ensure the rooms query with venue join is fast
create index if not exists rooms_venue_id_status_idx
  on public.rooms (venue_id, status);

-- 5. Add index for room_images sort order (speeds up image gallery loading)
create index if not exists room_images_room_id_sort_idx
  on public.room_images (room_id, sort_order);

-- 6. Add index for room_amenities lookup
create index if not exists room_amenities_room_id_idx
  on public.room_amenities (room_id);

-- 7. Add index for room_vibe_tags lookup
create index if not exists room_vibe_tags_room_id_idx
  on public.room_vibe_tags (room_id);
