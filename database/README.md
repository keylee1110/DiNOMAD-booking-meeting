# DiNOMAD Database

> Located at the **monorepo root** (`database/`), shared by both the Next.js frontend and NestJS backend.

## Source of Truth

**Supabase migrations are the source of truth** — not `schema.sql`.

| File | Purpose |
|---|---|
| `supabase/migrations/*.sql` | Applied migrations — what's actually in the live DB |
| `database/schema.sql` | Consolidated read-only reference (all migrations merged into one file) |

> **Do not run `database/schema.sql` directly against a database.**
> It is a reference snapshot for developers. To change the schema, create a new migration file.

## Active Migrations

| File | Date | What it adds |
|---|---|---|
| `20260531000000_initial_user_supplier_schema.sql` | 2026-05-31 | Enums, `profiles`, `suppliers`, `supplier_members`, `venues`, `rooms`, `room_images`, `room_amenities`, `room_vibe_tags`, RLS policies, helper functions |
| `20260605000000_bookings_payments_reviews.sql` | 2026-06-05 | `bookings`, `payments`, `reviews`, no-overlap GiST constraint |
| `20260605010000_profile_points_booking_code_wishlists.sql` | 2026-06-05 | `profiles.points`, `bookings.booking_code/points_*`, `wishlists`, `point_transactions`, loyalty triggers |
| `20260613000000_availability_slots.sql` | 2026-06-13 | `venues.open_time`/`close_time` columns, `availability_slots` table (superseded by next migration) |
| `20260614000000_room_blocks.sql` | 2026-06-14 | Drops `availability_slots` + pre-generation functions; adds `room_blocks` (sparse exception table) |
| `20260614010000_room_images_bucket.sql` | 2026-06-14 | Creates `room-images` Supabase Storage bucket (public, 5 MB limit) with RLS policies |

## How to Apply Migrations

### Supabase (recommended)
1. Open **Supabase Dashboard → SQL Editor**
2. Run each migration file in order (by filename prefix date)
3. Verify with **Table Editor** that all tables appear

### Local PostgreSQL
```bash
# From monorepo root
psql -U postgres -d dinomad -f supabase/migrations/20260531000000_initial_user_supplier_schema.sql
psql -U postgres -d dinomad -f supabase/migrations/20260605000000_bookings_payments_reviews.sql
psql -U postgres -d dinomad -f supabase/migrations/20260605010000_profile_points_booking_code_wishlists.sql
psql -U postgres -d dinomad -f supabase/migrations/20260609000000_missing_core_features.sql
```

## Key Design Decisions

- **UUID primary keys** — all tables use `gen_random_uuid()`, not serial integers.
- **All prices are INTEGER (VND)** — Vietnamese Dong has no sub-unit; never use DECIMAL for money.
- **Supabase Auth is the identity layer** — `auth.users` is the source of identity; `profiles` is the application extension. The `handle_new_auth_user()` trigger auto-creates a profile row on sign-up.
- **`bookings` has a no-overlap GiST constraint** — the database enforces non-overlapping bookings for the same room at the DB level (cancelled bookings excluded).
- **`room_blocks` sparse model** — available slots are computed on-demand from `venues.open_time`/`close_time`; only exceptions (partner-blocked slots) are stored. This avoids ~900 rows/room/month of "always available" noise. Blocked slots have real UUIDs; available slots get virtual IDs (`virtual-HH:MM`) in API responses.
- **`booking_code` auto-generated** — the `generate_unique_booking_code()` trigger creates `DN-XXXXXX` codes on insert.
- **Loyalty points** — `profiles.points` is the live balance; `point_transactions` is the immutable audit trail. The `process_booking_loyalty_points()` trigger keeps them in sync automatically.
- **RLS** — enabled on all tables. The backend uses `SERVICE_ROLE` key (bypasses RLS). The frontend uses `ANON`/`AUTHENTICATED` keys (RLS enforced).

## Current Tables (Live)

```
profiles            — user accounts (extends auth.users)
suppliers           — venue partner companies
supplier_members    — team members of a supplier
venues              — physical locations
rooms               — bookable spaces within a venue
room_images         — room photo gallery
room_amenities      — amenity tags per room
room_vibe_tags      — vibe/atmosphere tags per room
bookings            — confirmed reservations
payments            — payment records per booking
reviews             — post-stay guest ratings
wishlists           — user's saved favorite rooms
point_transactions  — loyalty point change audit log
room_blocks         — partner-blocked 30-min slots (sparse; available slots are computed)
notifications       — log of SMS/Zalo/email messages sent
```

## Planned Tables (Phase 2 — not yet created)

| Table | Purpose |
|---|---|
| `refunds` | Refund tracking per cancelled booking |
| `payouts` | Weekly partner settlement batches |
| `payout_items` | Line items per payout |
| `partner_applications` | Supplier onboarding intake form (pre-approval) |

## Money Flow

```
Guest pays → payments (paid)
          → bookings (confirmed)

Session ends → bookings (completed)
            → profiles.points updated (loyalty trigger)

Guest cancels → bookings (cancelled)
              → profiles.points refunded (loyalty trigger)
              [Phase 2] → refunds table → payouts adjustment
```
