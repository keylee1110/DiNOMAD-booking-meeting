# DiNOMAD — Database Schema (Supabase / PostgreSQL)

> Run these SQL statements in Supabase SQL Editor in order.
> Enable Row Level Security (RLS) on every table.

---

## Table of Contents

1. [Overview & Relationships](#1-overview--relationships)
2. [Extensions & Setup](#2-extensions--setup)
3. [Users & Auth](#3-users--auth)
4. [Venues & Rooms](#4-venues--rooms)
5. [Bookings](#5-bookings)
6. [Slot Locks](#6-slot-locks)
7. [Reviews](#7-reviews)
8. [Partner Applications](#8-partner-applications)
9. [Notifications Log](#9-notifications-log)
10. [Row Level Security (RLS)](#10-row-level-security-rls)
11. [Indexes](#11-indexes)
12. [Seed Data (Dev Only)](#12-seed-data-dev-only)

---

## 1. Overview & Relationships

```
auth.users (Supabase built-in)
    │
    └── profiles (1:1)
         │
         ├── bookings (1:many) ← guest
         └── venues (1:many)   ← partner
              │
              └── rooms (1:many)
                   │
                   ├── bookings (1:many)
                   ├── slot_locks (1:many)
                   └── reviews (1:many)
```

---

## 2. Extensions & Setup

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for scheduled jobs (reminders, cleanup)
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## 3. Users & Auth

Supabase handles `auth.users`. We extend it with a `profiles` table.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('guest', 'partner', 'admin')),
  avatar_url    TEXT,
  -- Loyalty points (Phase 2 — stored from day 1)
  qualifying_checkins  INTEGER NOT NULL DEFAULT 0,
  points               INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 4. Venues & Rooms

```sql
-- Venues (physical locations)
CREATE TABLE venues (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  name_vi       TEXT,
  address       TEXT NOT NULL,
  address_vi    TEXT,
  district      TEXT NOT NULL,
  city          TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
  phone         TEXT,
  lat           DECIMAL(10, 8),
  lng           DECIMAL(11, 8),
  image_url     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms (bookable spaces within a venue)
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id        UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_vi         TEXT,
  description     TEXT,
  description_vi  TEXT,
  category        TEXT NOT NULL CHECK (category IN ('team_hub', 'solo_nook')),
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  price_per_hour  INTEGER NOT NULL CHECK (price_per_hour > 0),  -- VND, integer only

  -- Amenities (boolean flags — easier to query than array)
  has_wifi        BOOLEAN NOT NULL DEFAULT FALSE,
  has_projector   BOOLEAN NOT NULL DEFAULT FALSE,
  has_whiteboard  BOOLEAN NOT NULL DEFAULT FALSE,
  has_ac          BOOLEAN NOT NULL DEFAULT FALSE,
  has_tv          BOOLEAN NOT NULL DEFAULT FALSE,
  has_coffee      BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking     BOOLEAN NOT NULL DEFAULT FALSE,
  has_printer     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Specs
  wifi_speed      TEXT,    -- e.g. "200 Mbps"
  tv_model        TEXT,    -- e.g. "65\" Samsung 4K"
  specs_json      JSONB,   -- for any extra specs

  -- Vibe tags (stored as array)
  vibe_tags       TEXT[] DEFAULT '{}',

  -- Images (array of public URLs)
  images          TEXT[] DEFAULT '{}',

  -- Quality
  rating          DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
  review_count    INTEGER NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,   -- partner can toggle this

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Bookings

```sql
CREATE TABLE bookings (
  id                      TEXT PRIMARY KEY,  -- "BK-XXXXXX" format
  room_id                 UUID NOT NULL REFERENCES rooms(id),
  user_id                 UUID REFERENCES profiles(id),  -- NULL for guest checkout

  -- Cached denormalized fields (avoid joins on booking history)
  room_name               TEXT NOT NULL,
  venue_name              TEXT NOT NULL,
  venue_address           TEXT NOT NULL,

  -- Time
  date                    DATE NOT NULL,
  start_time              TIME NOT NULL,
  end_time                TIME NOT NULL,
  duration_hours          DECIMAL(4,2) NOT NULL,

  -- Guest info (required even for registered users)
  guest_name              TEXT NOT NULL,
  guest_phone             TEXT NOT NULL,
  guest_email             TEXT,

  -- Pricing (all in VND integers)
  room_fee                INTEGER NOT NULL,
  platform_fee            INTEGER NOT NULL,
  total_price             INTEGER NOT NULL,

  -- Payment
  payment_method          TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'zalopay', 'card')),
  payment_transaction_id  TEXT,             -- PayOS transaction ID
  payment_order_code      BIGINT,           -- PayOS numeric order code
  paid_at                 TIMESTAMPTZ,

  -- Status
  status                  TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),

  -- Check-in
  access_code             TEXT NOT NULL,    -- 4-char code e.g. "K7P4"
  checked_in_at           TIMESTAMPTZ,
  wifi_password           TEXT,

  -- Cancellation & Refund
  cancelled_at            TIMESTAMPTZ,
  cancelled_by            TEXT CHECK (cancelled_by IN ('guest', 'venue', 'admin')),
  refund_amount           INTEGER,          -- VND
  refund_status           TEXT CHECK (refund_status IN ('none', 'processing', 'refunded')),

  -- Guest magic link token (for no-account access)
  guest_token             TEXT UNIQUE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Auto-complete sessions & award check-in points

```sql
-- Run every 5 minutes via pg_cron
CREATE OR REPLACE FUNCTION complete_finished_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions that ended > 30 min ago as completed
  UPDATE bookings
  SET status = 'completed'
  WHERE status = 'checked_in'
    AND (date + end_time) < NOW() - INTERVAL '30 minutes';

  -- Mark no-shows (confirmed but never checked in, session ended)
  UPDATE bookings
  SET status = 'no_show'
  WHERE status = 'confirmed'
    AND (date + end_time) < NOW() - INTERVAL '30 minutes';

  -- Award qualifying check-in points (Phase 1: just increment counter)
  UPDATE profiles p
  SET qualifying_checkins = qualifying_checkins + 1
  FROM bookings b
  WHERE b.user_id = p.id
    AND b.status = 'completed'
    AND b.checked_in_at IS NOT NULL
    AND b.points_awarded = FALSE;

  UPDATE bookings SET points_awarded = TRUE
  WHERE status = 'completed' AND points_awarded = FALSE;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('complete-sessions', '*/5 * * * *', 'SELECT complete_finished_sessions()');
```

> **Note:** Add `points_awarded BOOLEAN NOT NULL DEFAULT FALSE` to bookings table.

---

## 6. Slot Locks

Temporary locks during checkout (5-minute window).

```sql
CREATE TABLE slot_locks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  booking_id  TEXT,            -- set when booking is confirmed
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup expired locks (run every minute)
SELECT cron.schedule('cleanup-locks', '* * * * *', $$
  DELETE FROM slot_locks WHERE expires_at < NOW();
$$);
```

---

## 7. Transactions & Payments

### `transactions` — Every payment attempt

One booking can have **multiple** transactions (retries, method switches).  
The booking is only confirmed when a transaction reaches `paid`.

```sql
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- Amount (VND integers only)
  amount                INTEGER NOT NULL CHECK (amount > 0),

  -- Payment method chosen for this attempt
  payment_method        TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'zalopay', 'card')),

  -- Status lifecycle:
  -- pending → paid         (webhook: payment success)
  -- pending → failed       (webhook: payment failed / user cancelled in app)
  -- pending → expired      (5-min soft lock timeout, no payment received)
  -- paid    → refunded     (after refund processed)
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),

  -- PayOS fields (populated when payment link created)
  payos_order_code      BIGINT UNIQUE,          -- numeric ID sent to PayOS
  payos_payment_url     TEXT,                   -- checkout URL shown to user
  payos_transaction_id  TEXT,                   -- returned in webhook on success

  -- Timestamps
  expires_at            TIMESTAMPTZ,            -- 5 min after created_at
  paid_at               TIMESTAMPTZ,
  failed_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key rule:** When creating a new transaction attempt, expire any previous `pending`
transactions for the same booking first:

```sql
UPDATE transactions
SET status = 'expired', failed_at = NOW()
WHERE booking_id = $1 AND status = 'pending';
```

---

### `refunds` — Every refund attempt

Separate from transactions — a refund is a reverse money movement with its own lifecycle.

```sql
CREATE TABLE refunds (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            TEXT NOT NULL REFERENCES bookings(id),
  transaction_id        UUID NOT NULL REFERENCES transactions(id), -- which payment to reverse

  -- Amount to return (may be partial: 100%, 70%, or 0% based on policy)
  amount                INTEGER NOT NULL CHECK (amount >= 0),
  refund_percentage     INTEGER NOT NULL CHECK (refund_percentage BETWEEN 0 AND 100),

  -- Why was it cancelled?
  reason                TEXT NOT NULL
                          CHECK (reason IN (
                            'guest_cancel_full',    -- > 24h before, 100% back
                            'guest_cancel_partial', -- 4–24h before, 70% back
                            'guest_cancel_none',    -- < 4h before, 0% back
                            'venue_cancel',         -- venue cancelled, 100% back
                            'admin_manual'          -- admin override
                          )),

  -- Who triggered it
  initiated_by          TEXT NOT NULL CHECK (initiated_by IN ('guest', 'venue', 'admin')),

  -- Status lifecycle:
  -- processing → completed  (PayOS confirms refund sent)
  -- processing → failed     (PayOS refund API error)
  status                TEXT NOT NULL DEFAULT 'processing'
                          CHECK (status IN ('processing', 'completed', 'failed')),

  -- PayOS refund reference (returned when refund API call succeeds)
  payos_refund_id       TEXT,

  -- Timestamps
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### `payouts` — Weekly partner settlements

DiNOMAD holds all money, then transfers the partner's share weekly.  
A payout covers all **completed** bookings in a date range for one partner.

```sql
CREATE TABLE payouts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id            UUID NOT NULL REFERENCES profiles(id),

  -- The settlement period
  period_start          DATE NOT NULL,
  period_end            DATE NOT NULL,

  -- Money breakdown (VND integers)
  gross_booking_revenue INTEGER NOT NULL DEFAULT 0,  -- sum of all room_fees in period
  platform_commission   INTEGER NOT NULL DEFAULT 0,  -- sum of all platform_fees (DiNOMAD keeps this)
  refunded_amount       INTEGER NOT NULL DEFAULT 0,  -- deducted if refunds happened
  net_payout            INTEGER NOT NULL DEFAULT 0,  -- what partner actually receives
                                                     -- = gross_booking_revenue - refunded_amount

  -- Status lifecycle:
  -- pending    → processing  (admin clicks "Pay out")
  -- processing → paid        (bank transfer confirmed)
  -- processing → failed      (transfer failed, retry)
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'processing', 'paid', 'failed')),

  -- Bank transfer details (partner's account)
  bank_name             TEXT,
  bank_account_number   TEXT,
  bank_account_name     TEXT,   -- full name on account

  -- Proof of transfer
  transfer_reference    TEXT,   -- bank transfer reference number
  transfer_note         TEXT,   -- e.g. "DiNOMAD payout 01/06–07/06"
  paid_at               TIMESTAMPTZ,

  -- Admin who processed it
  processed_by          UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Line items: which bookings are included in each payout
CREATE TABLE payout_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payout_id       UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  booking_id      TEXT NOT NULL REFERENCES bookings(id),
  room_fee        INTEGER NOT NULL,       -- what partner earns from this booking
  platform_fee    INTEGER NOT NULL,       -- DiNOMAD's cut (kept, not paid out)
  refund_deducted INTEGER NOT NULL DEFAULT 0,  -- deducted if booking was refunded
  net_amount      INTEGER NOT NULL        -- room_fee - refund_deducted
);
```

---

## 8. Reviews

```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id  TEXT NOT NULL REFERENCES bookings(id),
  user_id     UUID REFERENCES profiles(id),
  guest_name  TEXT NOT NULL,   -- denormalized for display
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  comment_vi  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id)           -- one review per booking
);

-- Auto-update room rating and review_count
CREATE OR REPLACE FUNCTION update_room_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE room_id = NEW.room_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE room_id = NEW.room_id)
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_room_rating();
```

---

## 8. Partner Applications

```sql
CREATE TABLE partner_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  venue_name      TEXT NOT NULL,
  venue_address   TEXT NOT NULL,
  district        TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. Notifications Log

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  TEXT REFERENCES bookings(id),
  user_id     UUID REFERENCES profiles(id),
  type        TEXT NOT NULL,   -- 'booking_confirmed' | 'reminder' | 'cancelled' | 'refund'
  channel     TEXT NOT NULL,   -- 'zalo' | 'email' | 'sms'
  recipient   TEXT NOT NULL,   -- phone or email
  status      TEXT NOT NULL DEFAULT 'sent',
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. Row Level Security (RLS)

Enable RLS on all tables, then define policies.

```sql
-- Enable RLS
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_locks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- profiles: users see only their own
CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (auth.uid() = id);

-- venues: partners see/edit their own; everyone can read active venues
CREATE POLICY "venues: public read" ON venues
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "venues: partner manage" ON venues
  FOR ALL USING (auth.uid() = partner_id);

-- rooms: public read for available rooms; partners manage their rooms
CREATE POLICY "rooms: public read" ON rooms
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "rooms: partner manage" ON rooms
  FOR ALL USING (
    auth.uid() = (SELECT partner_id FROM venues WHERE id = venue_id)
  );

-- bookings: users see their own; guests via guest_token (handled in service layer)
CREATE POLICY "bookings: user own" ON bookings
  FOR ALL USING (auth.uid() = user_id);

-- transactions: users see transactions for their own bookings
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions: user own" ON transactions
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM bookings WHERE id = booking_id)
  );

-- refunds: users see refunds for their own bookings
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds: user own" ON refunds
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM bookings WHERE id = booking_id)
  );

-- payouts: partners see only their own payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts: partner own" ON payouts
  FOR SELECT USING (auth.uid() = partner_id);

ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_items: partner own" ON payout_items
  FOR SELECT USING (
    auth.uid() = (SELECT partner_id FROM payouts WHERE id = payout_id)
  );

-- Admin service role bypasses all RLS (uses service_role key)
```

---

## 11. Indexes

```sql
-- Rooms search
CREATE INDEX idx_rooms_district ON rooms USING GIN (to_tsvector('simple', name || ' ' || description));
CREATE INDEX idx_rooms_venue_id ON rooms (venue_id);
CREATE INDEX idx_rooms_category ON rooms (category);
CREATE INDEX idx_rooms_capacity ON rooms (capacity);
CREATE INDEX idx_rooms_price ON rooms (price_per_hour);

-- Bookings lookup
CREATE INDEX idx_bookings_room_date ON bookings (room_id, date);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_guest_phone ON bookings (guest_phone);
CREATE INDEX idx_bookings_guest_token ON bookings (guest_token);
CREATE INDEX idx_bookings_date ON bookings (date);

-- Slot locks
CREATE INDEX idx_slot_locks_room_date ON slot_locks (room_id, date);
CREATE INDEX idx_slot_locks_expires ON slot_locks (expires_at);

-- Reviews
CREATE INDEX idx_reviews_room_id ON reviews (room_id);

-- Transactions
CREATE INDEX idx_transactions_booking_id ON transactions (booking_id);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_payos_order ON transactions (payos_order_code);
CREATE INDEX idx_transactions_expires_at ON transactions (expires_at);

-- Refunds
CREATE INDEX idx_refunds_booking_id ON refunds (booking_id);
CREATE INDEX idx_refunds_transaction_id ON refunds (transaction_id);
CREATE INDEX idx_refunds_status ON refunds (status);

-- Payouts
CREATE INDEX idx_payouts_partner_id ON payouts (partner_id);
CREATE INDEX idx_payouts_status ON payouts (status);
CREATE INDEX idx_payouts_period ON payouts (period_start, period_end);
CREATE INDEX idx_payout_items_payout_id ON payout_items (payout_id);
CREATE INDEX idx_payout_items_booking_id ON payout_items (booking_id);
```

---

## 12. Seed Data (Dev Only)

```sql
-- Run only in development / staging
-- Insert a test admin user first via Supabase Dashboard, then:

INSERT INTO venues (id, partner_id, name, address, district, lat, lng) VALUES
  ('11111111-0000-0000-0000-000000000001', '<partner_user_id>', 'The Work Loft', '123 Nguyen Hue, District 1', 'Quận 1', 10.7769, 106.7009),
  ('11111111-0000-0000-0000-000000000002', '<partner_user_id>', 'Nomad Hub', '45 Vo Thi Sau, District 3', 'Quận 3', 10.7837, 106.6939);

INSERT INTO rooms (id, venue_id, name, category, capacity, price_per_hour, has_wifi, has_projector, has_ac, verified) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Summit Boardroom', 'team_hub', 10, 250000, TRUE, TRUE, TRUE, TRUE),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Focus Pod A', 'solo_nook', 2, 80000, TRUE, FALSE, TRUE, TRUE);
```

---

## Quick Reference: Booking Status Flow

```
pending       → confirmed   (payment webhook received)
confirmed     → checked_in  (partner scans booking ID + access code)
checked_in    → completed   (auto: 30 min after end_time)
confirmed     → no_show     (auto: 30 min after end_time, never checked in)
confirmed     → cancelled   (guest or venue cancels)
pending       → cancelled   (payment timeout after 5 min)
```

---

*Last updated: May 2026*
