# DiNOMAD – Backend API Specification

> **Backend:** NestJS in `backend/` (monorepo root)  
> **Base URL:** `http://localhost:3001/v1` (local) · `https://api.dinomad.vn/v1` (production)  
> **Configure in:** `.env.local` as `NEXT_PUBLIC_API_URL`  
> **Auth:** Supabase JWT Bearer token, except endpoints marked `[public]`

**Implementation status:**
- ✅ Implemented — endpoint exists and works
- 🔲 Planned — specified but not yet built

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Models](#2-data-models)
3. [Authentication & Users](#3-authentication--users)
4. [Suppliers API](#4-suppliers-api)
5. [Rooms API](#5-rooms-api)
6. [Bookings API](#6-bookings-api)
7. [Partner API](#7-partner-api)
8. [Admin API](#8-admin-api)
9. [Payments Integration](#9-payments-integration)
10. [Check-in Flow](#10-check-in-flow)
11. [Error Format](#11-error-format)
12. [Frontend Integration Guide](#12-frontend-integration-guide)

---

## 1. Architecture Overview

### Monorepo layout

```
dinomad/                     ← git root
├── (Next.js frontend)       ← http://localhost:3000
├── backend/                 ← NestJS backend (http://localhost:3001)
│   └── src/modules/         ← auth, users, suppliers, health, [rooms, bookings, ...]
├── supabase/migrations/     ← source of truth for the database
└── database/schema.sql      ← consolidated reference view
```

### Runtime communication

```
Next.js frontend (localhost:3000)
        │
        │  HTTP REST  (NEXT_PUBLIC_API_URL)
        ▼
NestJS backend (localhost:3001)
        │               │                  │
        ▼               ▼                  ▼
   Supabase DB     Supabase Auth      PayOS Gateway
   (PostgreSQL)    (JWT validation)   (VietQR/MoMo/
                                       ZaloPay/Card)
```

### Implemented modules (`backend/src/modules/`)

| Module | Status | Endpoints |
|---|---|---|
| `health` | ✅ | `GET /health` |
| `auth` | ✅ | Guards & token validation (no dedicated controller) |
| `users` | ✅ | `GET /users/me`, `PATCH /users/me`, `GET /users` |
| `suppliers` | ✅ | `GET/POST/PATCH /suppliers/*` |
| `rooms` | ✅ | Venues, rooms, slots, scanner, earnings (`/partner/*`) |
| `bookings` | ✅ | `POST /bookings` — server-authoritative create + payment row |
| `payments` | ✅ (partial) | Row written by `POST /bookings` (simulated gateway; no PayOS yet) |
| `partner` | ✅ | Implemented under the `rooms` module (`/partner/*`) |
| `admin` | 🔲 (partial) | Only suppliers/users implemented |
| `notifications` | 🔲 | To be created |

---

## 2. Data Models

### User (profile)

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "phone": "0912345678",
  "avatar_url": "https://...",
  "role": "customer",
  "status": "active",
  "points": 120,
  "created_at": "2026-05-01T10:00:00Z"
}
```

**Roles:** `customer` | `supplier` | `admin`

### Room

```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "name": "Summit Boardroom",
  "name_vi": "Phòng Họp Summit",
  "description": "...",
  "description_vi": "...",
  "district": "Quận 1",
  "address": "123 Nguyen Hue, District 1",
  "capacity": 10,
  "price_per_hour": 250000,
  "category": "team_hub",
  "status": "published",
  "verified": true,
  "noise_level": 3.5,
  "specs": { "tv": "65\" Samsung", "wifi_speed": "200 Mbps" },
  "amenities": ["wifi", "projector", "whiteboard", "ac"],
  "vibe_tags": ["discussion_friendly", "modern"],
  "images": ["https://..."],
  "rating": 4.8,
  "review_count": 124
}
```

### TimeSlot

```json
{
  "id": "uuid",
  "slot_start": "2026-06-15T09:00:00+07:00",
  "slot_end":   "2026-06-15T09:30:00+07:00",
  "slot_status": "available"
}
```

**Status values:** `available` | `held` | `booked` | `occupied` | `blocked`

### Booking

```json
{
  "id": "uuid",
  "room_id": "uuid",
  "customer_id": "uuid",
  "booking_date": "2026-06-15",
  "start_time": "2026-06-15T09:00:00+07:00",
  "end_time":   "2026-06-15T11:00:00+07:00",
  "status": "confirmed",
  "price_per_hour": 250000,
  "subtotal": 500000,
  "platform_fee": 50000,
  "total_amount": 550000,
  "booking_code": "DN-A3F9K2",
  "qr_code_token": "...",
  "guest_token": "...",
  "points_redeemed": 0,
  "points_earned": 10,
  "payment_status": "paid",
  "checked_in_at": null,
  "created_at": "2026-06-10T08:30:00Z"
}
```

**Booking status:** `pending` → `confirmed` → `completed` | `cancelled`

---

## 3. Authentication & Users

Auth is handled by **Supabase Auth** on the client side. The backend validates the Supabase JWT on every protected request via `JwtAuthGuard`.

### ✅ GET `/health` [public]

```json
// Response 200
{ "status": "ok", "service": "dinomad-backend", "timestamp": "..." }
```

### ✅ GET `/users/me`

Returns the authenticated user's profile.

```
Headers: Authorization: Bearer <supabase_access_token>
```

```json
// Response 200
{ "data": { ...User } }
```

### ✅ PATCH `/users/me`

Update own profile fields.

```json
// Request
{ "full_name": "Nguyen Van A", "phone": "0912345678", "avatar_url": "https://..." }

// Response 200
{ "data": { ...User } }
```

### ✅ GET `/users` (admin only)

Returns all users, ordered by created_at desc.

```json
// Response 200
{ "data": [ ...User[] ] }
```

### 🔲 POST `/auth/register` [public]

> **Note:** Registration is handled by Supabase Auth on the frontend (`supabase.auth.signUp()`).
> This endpoint is planned as a backend-side registration flow for scenarios that require
> server-side role assignment.

### 🔲 POST `/auth/logout`

Invalidate the current session.

---

## 4. Suppliers API

### ✅ GET `/suppliers/me`

Returns the current user's supplier memberships (with supplier details and role).

```json
// Response 200
{
  "data": [
    {
      "supplier": { ...Supplier },
      "role": "owner",
      "is_active": true
    }
  ]
}
```

### ✅ POST `/suppliers/applications`

Submit a supplier application (creates a supplier record + adds caller as owner via RPC).

```json
// Request
{
  "legal_name": "Cong Ty TNHH ABC",
  "display_name": "ABC Workspace",
  "tax_code": "0123456789",
  "business_email": "contact@abc.vn",
  "business_phone": "028 1234 5678",
  "onboarding_note": "We have 3 meeting rooms in District 1."
}

// Response 201
{ "data": { "supplier_id": "uuid" } }
```

### ✅ GET `/suppliers` (admin only)

Returns all suppliers.

```json
// Response 200
{ "data": [ ...Supplier[] ] }
```

### ✅ GET `/suppliers/:id` (admin or supplier member)

Returns a single supplier's details.

```json
// Response 200
{ "data": { ...Supplier } }
```

### ✅ PATCH `/suppliers/:id` (admin or supplier manager)

Update supplier info or status.

```json
// Request
{
  "status": "approved",
  "display_name": "New Name",
  "onboarding_note": "Updated description"
}

// Response 200
{ "data": { ...Supplier } }
```

---

## 5. Rooms API

### 🔲 GET `/rooms` [public]

Search and filter rooms.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search (name, description) |
| `district` | string | Filter by district |
| `capacity` | number | Minimum capacity |
| `amenities` | string (CSV) | e.g. `wifi,projector` |
| `minPrice` | number | Min price per hour (VND) |
| `maxPrice` | number | Max price per hour (VND) |
| `date` | string | `YYYY-MM-DD` — only rooms with availability on this date |
| `sortBy` | string | `price_asc` \| `price_desc` \| `rating` \| `newest` |
| `page` | number | Default: 1 |
| `limit` | number | Default: 12, max: 50 |

```json
// Response 200
{ "data": [ ...Room[] ], "meta": { "total": 45, "page": 1, "limit": 12 } }
```

### 🔲 GET `/rooms/:id` [public]

```json
// Response 200
{ "data": { ...Room, "reviews": [ ...Review[] ] } }
```

### 🔲 GET `/rooms/:id/slots?date=YYYY-MM-DD` [public]

Returns availability slots from `availability_slots` table for this room and date.

```json
// Response 200
{
  "data": {
    "date": "2026-06-15",
    "slots": [
      { "id": "uuid", "slot_start": "...", "slot_end": "...", "slot_status": "available" },
      ...
    ]
  }
}
```

### 🔲 POST `/rooms/:id/reviews`

```json
// Request
{ "rating": 5, "comment": "Great space!", "comment_vi": "Không gian tuyệt!", "booking_id": "uuid" }

// Response 201
{ "data": { ...Review } }
```

---

## 6. Bookings API

### 🔲 POST `/bookings`

Creates a booking. Holds the selected slots (5-min soft lock) and returns a payment URL.

```json
// Request
{
  "room_id": "uuid",
  "start_time": "2026-06-15T09:00:00+07:00",
  "end_time":   "2026-06-15T11:00:00+07:00",
  "payment_method": "momo",
  "points_redeemed": 0
}

// Response 201
{
  "data": {
    ...Booking,
    "payment_url": "https://pay.payos.vn/..."
  }
}
```

### 🔲 GET `/bookings` (auth required)

Returns bookings for the authenticated user.

```json
// Response 200
{ "data": [ ...Booking[] ], "meta": { "total": 12, "page": 1 } }
```

### 🔲 GET `/bookings/:id` (auth or guest_token)

Accepts `?token=<guest_token>` for no-account access.

```json
// Response 200
{ "data": { ...Booking } }
```

### 🔲 PATCH `/bookings/:id/cancel`

Cancels a booking. Calculates and initiates refund per policy (100%/70%/0%).

```json
// Response 200
{ "data": { ...Booking, "status": "cancelled", "refund_amount": 385000 } }
```

---

## 7. Partner API

All partner endpoints require `role: supplier`.

### 🔲 GET `/partner/stats`

```json
// Response 200
{
  "data": {
    "total_revenue": 12500000,
    "total_bookings": 48,
    "avg_rating": 4.7,
    "active_rooms": 3,
    "pending_bookings": 2
  }
}
```

### 🔲 GET `/partner/venues`

Lists venues the authenticated supplier member manages.

### 🔲 POST `/partner/venues`

Create a new venue under the supplier.

### 🔲 GET `/partner/venues/:venueId/rooms`

### 🔲 POST `/partner/venues/:venueId/rooms`

### 🔲 PATCH `/partner/rooms/:roomId/status`

Toggle room status (`published` / `unavailable`).

### 🔲 GET `/partner/bookings`

All bookings across rooms the partner manages. Supports `?status=` and `?date=`.

### 🔲 GET `/partner/earnings?startDate=&endDate=`

```json
// Response 200
{
  "data": {
    "items": [
      { "date": "2026-06-01", "revenue": 850000, "bookings": 3, "commission": 85000 }
    ],
    "total_revenue": 12500000,
    "total_commission": 1250000
  }
}
```

### 🔲 POST `/partner/bookings/:id/check-in`

Mark a booking as checked in after scanning the guest's QR code.

```json
// Request
{ "qr_code_token": "<token from QR>" }

// Response 200
{ "data": { ...Booking, "status": "confirmed", "checked_in_at": "..." } }
```

---

## 8. Admin API

All admin endpoints require `role: admin`.

### ✅ GET `/users` — admin only (see Section 3)

### ✅ GET `/suppliers`, `GET /suppliers/:id`, `PATCH /suppliers/:id` — (see Section 4)

### 🔲 GET `/admin/stats`

```json
// Response 200
{
  "data": {
    "total_bookings": 1204,
    "total_revenue": 48500000,
    "active_users": 892,
    "avg_rating": 4.6,
    "pending_suppliers": 3
  }
}
```

### 🔲 GET `/admin/bookings`

All platform bookings. Supports `?status=`, `?date=`, `?search=`, `?page=`, `?limit=`.

### 🔲 GET `/admin/rooms`

All rooms. Supports `?venue_id=`, `?status=`, `?verified=`.

### 🔲 PATCH `/admin/rooms/:id`

Update room fields (e.g. set `verified: true`).

### 🔲 GET `/admin/analytics?startDate=&endDate=`

Revenue, booking counts, top rooms, top districts.

---

## 9. Payments Integration

Payment is handled via **PayOS** (supports VietQR, MoMo, ZaloPay, and card).

### Payment flow

```
1. POST /bookings  →  backend creates booking (status: pending)
2. Backend creates PayOS payment link (orderCode = numeric booking ref)
3. Response includes payment_url  →  frontend redirects user
4. User pays in bank/wallet app
5. PayOS calls POST /webhooks/payment
6. Backend verifies signature, updates booking to 'confirmed'
7. Slots updated to 'booked', confirmation SMS sent to guest
```

### 🔲 POST `/webhooks/payment` [public — PayOS only]

```json
// Body (PayOS webhook format)
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 123456,
    "amount": 550000,
    "description": "DN-A3F9K2",
    "accountNumber": "...",
    "reference": "...",
    "transactionDateTime": "...",
    "currency": "VND",
    "paymentLinkId": "..."
  },
  "signature": "..."
}
```

On `code === "00"` (success):
1. Set `booking.status = 'confirmed'`
2. Set `payments.status = 'successful'`
3. Set `availability_slots.slot_status = 'booked'` for affected slots
4. Send confirmation SMS/Zalo to guest
5. Send new booking alert to partner

---

## 10. Check-in Flow

```
1. Guest arrives at venue
2. Partner opens /partner/scanner
3. Partner scans guest's QR code (value = qr_code_token)
4. Frontend calls POST /partner/bookings/:id/check-in
5. Backend validates:
   - booking.status === 'confirmed'
   - booking start_time is within ±30 min of now
   - qr_code_token matches
6. Backend sets booking.checked_in_at = now()
7. availability_slots.slot_status updated to 'occupied'
8. Partner scanner shows success screen with room details
```

---

## 11. Error Format

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The selected time slot is no longer available.",
    "messageVi": "Khung giờ bạn chọn không còn trống."
  }
}
```

### Common Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid Bearer token |
| `FORBIDDEN` | 403 | Authenticated but wrong role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `SLOT_UNAVAILABLE` | 409 | Time slot already booked |
| `BOOKING_LOCKED` | 409 | Slot is held by another checkout (5-min lock) |
| `VALIDATION_ERROR` | 422 | Request body fails DTO validation |
| `PAYMENT_FAILED` | 402 | Payment provider returned failure |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## 12. Frontend Integration Guide

Replace mock data files one at a time. Do not refactor multiple files at once.

| Mock file | Replace with |
|---|---|
| `lib/data/rooms.ts` → `getAllRooms()`, `searchRooms()` | `GET /rooms` |
| `lib/data/rooms.ts` → `getRoomById()` | `GET /rooms/:id` |
| `lib/data/time-slots.ts` → `generateTimeSlots()` | `GET /rooms/:id/slots?date=` |
| `lib/store/booking-store.tsx` → `CONFIRM_BOOKING` | `POST /bookings` |
| `lib/store/booking-store.tsx` → localStorage bookings | `GET /bookings` |
| `lib/data/venues.ts` | `GET /partner/venues` |
| `lib/data/bookings.ts` (admin) | `GET /admin/bookings` |

### Fetch wrapper

Create `lib/api.ts` when backend endpoints are ready:

```ts
import { createClient } from "@/lib/supabase/client"

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) throw await res.json()
  return res.json()
}
```

### Environment variables

`.env.local` (frontend):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`backend/.env`:
```env
PORT=3001
NODE_ENV=development
API_PREFIX=v1
CORS_ORIGIN=http://localhost:3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PAYOS_CLIENT_ID=xxx
PAYOS_API_KEY=xxx
PAYOS_CHECKSUM_KEY=xxx
PLATFORM_FEE_RATE=0.10
SLOT_LOCK_SECONDS=300
FRONTEND_URL=http://localhost:3000
```

---

*Last updated: June 2026 — reflects backend implementation through feat/ViNTD*
