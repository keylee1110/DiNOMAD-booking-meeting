# Spec: Server-Authoritative Booking Creation (`POST /bookings`)

**Status:** `done`
**PRD ref:** §4 (Checkout), §5 (Payment), §6 (Confirmation), §15 (Loyalty Points)
**Branch:** `main`
**Author:** Nguyen Dieu Vi
**Date:** 2026-06-20

---

## Overview

Booking creation currently happens **client-side** — the browser computes the fee, points, and deposit split, then inserts directly into Supabase. That means the client is trusted with money math and the `payments` row is never written. This spec moves booking creation behind the NestJS backend: the client sends only *intent* (room, date, time, payment choice), and the server recomputes all amounts, validates availability, and writes the booking + payment atomically. This is the first step in the "client sends intent, backend owns truth" direction agreed for heavy logic.

---

## Acceptance Criteria

- [x] `POST /bookings` creates a booking for the authenticated customer
- [x] Server recomputes `subtotal`, `platform_fee` (10%), `total_amount`, `points_redeemed`, `points_earned` — client-sent amounts are ignored
- [x] Server validates the room is published and the time range is 30-min aligned, within venue open/close hours, and not in the past
- [x] Double-booking is rejected (overlap) with HTTP 409
- [x] A matching `payments` row is created (`status: successful`, correct amount for deposit vs full)
- [x] Loyalty points are deducted/earned via the existing DB trigger (no duplicate client logic)
- [x] Checkout page calls the endpoint and renders the server's canonical booking
- [x] Guests (unauthenticated) keep the localStorage-only path unchanged

**Out of scope:**
- Real PayOS payment (still simulated — payment row is marked successful immediately)
- 5-minute server-side soft slot lock (deferred; overlap constraint covers double-booking for now)
- Refund/cancellation endpoint (separate spec)

---

## Backend

### New module: `backend/src/modules/bookings/`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings` | authenticated (any role) | Create a confirmed booking + payment |

### DTO — `CreateBookingDto`

```typescript
class CreateBookingDto {
  roomId: string          // @IsUUID
  date: string            // @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startTime: string       // @Matches(/^\d{2}:\d{2}$/)  "HH:MM"
  endTime: string         // @Matches(/^\d{2}:\d{2}$/)
  paymentMode: "deposit" | "full"             // @IsIn
  paymentMethod: "vietqr"|"momo"|"zalopay"|"card"  // @IsIn
  redeemPoints?: boolean  // @IsOptional @IsBoolean  — apply loyalty points
}
```

### Response shape

```typescript
{
  id: string                // real uuid
  bookingCode: string       // DN-XXXXXX (DB trigger)
  roomId: string
  date: string
  startTime: string         // "HH:MM" (Vietnam)
  endTime: string
  status: "confirmed"
  subtotal: number
  platformFee: number
  totalAmount: number       // after points
  pointsRedeemed: number
  pointsEarned: number
  amountPaidNow: number     // deposit (20% room + platform) or full total
  paymentStatus: "deposited" | "fully_paid"
  qrCodeToken: string | null
  createdAt: string
}
```

### DB changes

None. Reuses existing schema/triggers:
- `bookings.id` `default gen_random_uuid()`, `booking_code` via trigger
- `process_booking_loyalty_points` trigger handles point deduct/earn
- `bookings_no_overlap` GiST exclusion constraint rejects overlaps
- `payments` table (already exists, currently unused)

### Service logic (atomic via staged insert)

```
1. Resolve room: price_per_hour, venue_id, status — must be 'published'
2. Resolve venue: open_time/close_time, status 'published'
3. Validate time range: HH:MM 30-min aligned, start<end, within open/close,
   not in the past (Asia/Ho_Chi_Minh)
4. Recompute server-side:
     roomFee      = price_per_hour * durationHours
     platformFee  = round(roomFee * 0.10)
     gross        = roomFee + platformFee
     pointsRedeemed = redeemPoints ? min(gross, profile.points) : 0
     totalAmount  = gross - pointsRedeemed
     pointsEarned = round(totalAmount * 0.01)
     amountPaidNow = deposit ? round(roomFee*0.2 + platformFee) - pointsRedeemed
                             : totalAmount
5. INSERT booking status='pending' (reserves slot via constraint, NO points yet)
     → on overlap (23P01) throw 409 Conflict
6. INSERT payments row (status 'successful', amount=amountPaidNow)
     → on failure: delete pending booking, throw 500
7. UPDATE booking pending→confirmed  (points trigger fires here)
     → on failure: delete pending booking + payment, throw 500
8. Re-fetch booking, return canonical response
```

> **Why staged pending→confirmed:** the loyalty-points trigger only moves points
> when status becomes confirmed/completed. Inserting `pending` first reserves the
> slot without touching points, so a failed payment insert can be rolled back by
> deleting the pending row — points are only committed on the final flip to
> `confirmed`. (Supabase JS has no multi-statement transaction; this staging is the
> pragmatic equivalent that keeps points correct.)

### Error cases

| Condition | HTTP |
|---|---|
| Room not found / not published | 404 |
| Invalid/past/misaligned time | 400 |
| Overlapping booking (slot taken) | 409 |
| Not authenticated | 401 |

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `lib/api/bookings.ts` | `createBooking(payload)` → calls `POST /bookings` with bearer token |

### Modified files

| File | Change |
|---|---|
| `app/[locale]/(main)/checkout/page.tsx` | `handleSimulatePaymentSuccess`: authenticated users call `createBooking()` instead of direct Supabase insert; use server-returned amounts/id/code. Guests keep localStorage path. |

### State shape

Booking object is built from the **server response** (id, bookingCode, amounts, points) plus local room display info (name, address, wifi).

---

## Test Plan

- [ ] Manual: logged-in customer → checkout → confirm → row in `bookings` (real uuid) AND row in `payments`
- [ ] Check: server amounts match (tamper client total in devtools → server still computes correctly)
- [ ] Manual: book an already-taken slot → 409, friendly error, no row
- [ ] Check: points deducted/earned on `profiles` after a redeem booking
- [ ] Manual: deposit vs full → `payments.amount` and `payment_status` differ correctly
- [ ] Guest (logged out): booking still saved to localStorage, no backend call

---

## Notes

- Replaces the client-side insert documented in `feat-guest-booking-persistence.md`.
- Real PayOS integration and the 5-minute soft lock are follow-up specs.
- Establishes the pattern for heavy logic: **client sends intent, backend recomputes truth**.
