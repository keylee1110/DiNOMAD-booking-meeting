# DiNOMAD – Frontend Developer Guide

> **Status:** Next.js frontend with Supabase Auth integrated. Most data still uses mock files — backend API integration is in progress.  
> **Audience:** Frontend & fullstack developers joining or reviewing the project.  
> **You are in:** the monorepo root (the Next.js app IS the root package)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Routing & Pages](#5-routing--pages)
6. [Data Layer](#6-data-layer)
7. [TypeScript Interfaces](#7-typescript-interfaces)
8. [State Management](#8-state-management)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Component Architecture](#10-component-architecture)
11. [Styling System](#11-styling-system)
12. [Key User Flows](#12-key-user-flows)
13. [What Needs Backend Integration](#13-what-needs-backend-integration)
14. [Known Issues & TODOs](#14-known-issues--todos)
15. [Partner Portal Implementation Notes](#15-partner-portal-implementation-notes)
16. [Room / Venue CRUD Implementation Notes](#16-room--venue-crud-implementation-notes)

> **Spec-driven development:** Every feature built in this repo has a corresponding spec in `docs/specs/`.  
> Start there before reading this guide for any feature-specific detail.  
> See `docs/specs/README.md` for the process and template.

---

## 1. Project Overview

DiNOMAD is a **meeting room and workspace booking marketplace** for Ho Chi Minh City. It connects:

- **Guests (customers)** — search, book, and check in to verified workspaces
- **Partners (suppliers)** — venue owners who list and manage their spaces
- **Admins** — internal team with oversight over the platform

This is the `root` package in the DiNOMAD monorepo. The backend lives in `backend/` and is being built in parallel.

**Authentication is live:** Supabase Auth is integrated for signup, login, Google/Facebook OAuth, and session management. Booking and wishlist data now persists to Supabase for logged-in users.

---

## 2. Tech Stack

| Layer | Library / Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.7.3 |
| UI Runtime | React | 19.2.4 |
| Styling | Tailwind CSS v4 | 4.2.0 |
| Component Primitives | Radix UI (shadcn/ui) | various |
| Forms | React Hook Form + Zod | 7.54.1 / 3.24.1 |
| Auth | @supabase/ssr + supabase-js | latest |
| Charts | Recharts | 2.15.0 |
| Date Utilities | date-fns | 4.1.0 |
| Icons | Lucide React | 0.564.0 |
| Notifications | Sonner (toasts) | 1.7.1 |
| Theme | next-themes | 0.4.6 |
| Carousel | Embla Carousel | 8.6.0 |

---

## 3. Getting Started

```bash
# From the monorepo root (recommended)
pnpm install

# Run only the frontend
pnpm dev                 # http://localhost:3000

# Run frontend + backend together
pnpm dev & pnpm dev:backend

# Build
pnpm build
```

The app opens at `http://localhost:3000` and immediately redirects to `/vi` (Vietnamese locale, the default).

> **Note:** `next.config.mjs` has `typescript: { ignoreBuildErrors: true }` and `images: { unoptimized: true }`. Fix these before production.

---

## 4. Project Structure

### Monorepo root (actual layout)

```
dinomad/                           ← git root
├── (Next.js files)                ← YOU ARE HERE — frontend IS the root package
├── backend/                       ← NestJS backend (@dinomad/backend)
│   └── src/
│       ├── modules/               ← auth, users, suppliers, health
│       ├── common/                ← filters, interceptors, decorators
│       ├── config/
│       ├── database/              ← SupabaseService
│       └── main.ts
├── supabase/
│   └── migrations/                ← SOURCE OF TRUTH for the database
├── database/
│   └── schema.sql                 ← consolidated reference (read-only)
├── docs/                          ← all project documentation
├── CLAUDE.md                      ← AI agent rules for the whole repo
├── package.json                   ← root = Next.js deps + workspace scripts
└── pnpm-workspace.yaml            ← declares "." and "backend"
```

Run commands:
```bash
pnpm dev             # frontend on :3000
pnpm dev:backend     # backend on :3001
```

### Frontend at root

```
app/
├── layout.tsx                     # Root layout (fonts, Vercel Analytics, theme)
├── page.tsx                       # Redirects to /vi
└── [locale]/
    ├── layout.tsx                 # i18n provider, locale setup
    ├── (main)/                    # Public-facing routes (header + footer)
    │   ├── page.tsx               # Landing page
    │   ├── search/                # Search & filter results
    │   ├── rooms/[id]/            # Room detail + time slot picker
    │   ├── checkout/              # Multi-step checkout
    │   │   ├── page.tsx
    │   │   ├── success/           # Booking confirmation + QR code
    │   │   ├── cancel/
    │   │   └── _components/
    │   ├── my-bookings/           # Booking history (Supabase for logged-in, localStorage for guests)
    │   ├── wishlist/              # Saved favorite rooms (Supabase)
    │   └── profile/               # User profile settings
    ├── admin/                     # Admin dashboard (auth guard)
    ├── partner/                   # Partner portal (auth guard)
    ├── login/                     # Login page (Supabase Auth — functional)
    ├── signup/                    # Registration page (Supabase Auth — functional)
    └── api/auth/callback/         # OAuth callback handler

components/
├── layout/                        # Header, Footer, MobileNav, AdminSidebar
├── ui/                            # DO NOT EDIT — Radix/shadcn primitives
├── room-card.tsx
├── time-slot-picker.tsx
├── amenity-icon.tsx
├── qr-code.tsx
├── price-display.tsx
├── verified-badge.tsx
├── countdown-timer.tsx
└── language-switcher.tsx

lib/
├── data/                          # MOCK DATA — will be replaced by API calls
│   ├── rooms.ts
│   ├── venues.ts
│   ├── bookings.ts
│   └── time-slots.ts
├── types/index.ts                 # All frontend types — no inline interfaces in components
├── store/booking-store.tsx        # React Context + Reducer (Supabase integrated)
├── i18n/                          # Locale config, provider, en.json + vi.json
├── supabase/                      # Supabase client helpers (client.ts, server.ts, middleware.ts)
├── format.ts                      # formatVND(), formatDate(), generateBookingId()
└── utils.ts                       # cn() helper
```

---

## 5. Routing & Pages

All routes are prefixed with a locale segment (`/vi` or `/en`).

### Public Routes (`/(main)`)

| Route | File | Description |
|---|---|---|
| `/[locale]` | `(main)/page.tsx` | Landing page — hero, search, featured rooms |
| `/[locale]/search` | `(main)/search/page.tsx` | Search results with filters |
| `/[locale]/rooms/[id]` | `(main)/rooms/[id]/page.tsx` | Room detail, images, reviews, slot picker |
| `/[locale]/checkout` | `(main)/checkout/page.tsx` | Guest info form + payment step |
| `/[locale]/checkout/success` | `checkout/success/page.tsx` | Booking confirmation + QR code |
| `/[locale]/checkout/cancel` | `checkout/cancel/page.tsx` | Payment cancelled screen |
| `/[locale]/my-bookings` | `(main)/my-bookings/page.tsx` | Booking history |
| `/[locale]/wishlist` | `(main)/wishlist/page.tsx` | Saved rooms |
| `/[locale]/profile` | `(main)/profile/page.tsx` | User account settings |

### Auth Routes

| Route | Description | Status |
|---|---|---|
| `/[locale]/login` | Email/password + Google/Facebook OAuth | ✅ Functional |
| `/[locale]/signup` | Email/password + role selection | ✅ Functional |
| `/api/auth/callback` | Supabase OAuth callback handler | ✅ Functional |

### Partner Routes

| Route | File | Description | Status |
|---|---|---|---|
| `/[locale]/partner` | `partner/page.tsx` | Dashboard — live stats, pending check-ins, upcoming bookings, activity feed | ✅ Done |
| `/[locale]/partner/venues` | `partner/venues/page.tsx` | Room & venue CRUD — wired to real backend API | ✅ Done |
| `/[locale]/partner/schedule` | `partner/schedule/page.tsx` | Booking schedule with status filters and action buttons | ✅ Done |
| `/[locale]/partner/inventory` | `partner/inventory/page.tsx` | Room availability — slot-level Strict Mode + room-level Available/Busy toggle | ✅ Done |
| `/[locale]/partner/earnings` | `partner/earnings/page.tsx` | Revenue stats, per-booking breakdown table, payout history | ✅ Done |
| `/[locale]/partner/scanner` | `partner/scanner/page.tsx` | Check-in verification — Booking ID + Access Code form with full state machine | ✅ Done |

### Admin Routes

| Route | Description |
|---|---|
| `/[locale]/admin` | Dashboard with stats, recent bookings |
| `/[locale]/admin/bookings` | All bookings table |
| `/[locale]/admin/rooms` | Room management table |
| `/[locale]/admin/suppliers` | Partner management |
| `/[locale]/admin/analytics` | Revenue charts (Recharts) |
| `/[locale]/admin/users` | User management |
| `/[locale]/admin/settings` | Settings |

---

## 6. Data Layer

### What's live (Supabase)

| Feature | Location | Backend |
|---|---|---|
| Auth (signup/login/OAuth) | `lib/supabase/` + `/login`, `/signup` pages | ✅ Supabase Auth |
| User profile | `lib/store/booking-store.tsx` | ✅ `profiles` table |
| Bookings (logged-in users) | `lib/store/booking-store.tsx` | ✅ `bookings` table |
| Wishlist (logged-in users) | `lib/store/booking-store.tsx` | ✅ `wishlists` table |
| Loyalty points | `lib/store/booking-store.tsx` | ✅ `profiles.points` |

### What's still mock

All data in `lib/data/` is mock — no API calls. Replace these when the backend endpoints are ready.

#### `lib/data/rooms.ts`

```ts
getAllRooms(): Room[]
getRoomById(id: string): Room | undefined
searchRooms(params: { query?, district?, capacity?, amenities?, minPrice?, maxPrice?, sortBy? }): Room[]
getLocalizedRoom(room: Room, locale: Locale): Room  // swaps Vi fields
```

#### `lib/data/time-slots.ts`

```ts
generateTimeSlots(date: string, roomId: string): TimeSlot[]
// Generates 30-min slots from 07:00 to 22:00
// Uses roomId + date as seed for deterministic (but fake) availability
```

#### `lib/data/venues.ts`

```ts
venues[]     // mock venue array
partners[]   // mock partner data
getEarningsData()  // mock earnings for partner dashboard
```

#### `lib/data/bookings.ts`

Static array of demo bookings used in partner and admin views.

```ts
bookings[]          // 8 demo bookings across multiple venues
                    // Includes 2 bookings for today (2026-06-09) with accessCode for check-in testing:
                    //   BK-20260609-001  Focus Pod A        accessCode: "A3F7"
                    //   BK-20260609-002  Sunshine Meeting   accessCode: "B9K2"

getBookingById(id)
getBookingsByDate(date)
getBookingsByVenue(venueId)
```

### Guest user persistence

For guests not logged in, bookings are persisted to `localStorage` under key `dinomad_bookings`. The booking store automatically detects auth state and uses the appropriate storage.

### API client (`lib/api/partner.ts`)

All partner backend calls go through `lib/api/partner.ts`. It reads the Supabase session token automatically and attaches `Authorization: Bearer <token>`.

```ts
import {
  getPartnerVenues,    // GET  /partner/venues
  createVenue,         // POST /partner/venues
  updateVenue,         // PATCH /partner/venues/:id
  createRoom,          // POST /partner/venues/:venueId/rooms
  updateRoom,          // PATCH /partner/rooms/:id
  updateRoomStatus,    // PATCH /partner/rooms/:id/status
  deleteRoom,          // DELETE /partner/rooms/:id  (archives, not hard-delete)
} from "@/lib/api/partner"
```

Base URL is set via `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
```

### Partner-side localStorage keys

The partner portal uses these keys (all frontend-only until backend endpoints are ready):

| Key | Shape | Written by | Read by |
|---|---|---|---|
| `dinomad_bookings` | `Booking[]` | Booking store, check-in scanner | Dashboard, scanner, schedule |
| `dinomad_checkins` | `CheckInRecord[]` | Scanner on confirm check-in | Dashboard stats, scanner recent scans |
| `dinomad_room_status` | `{ [roomId]: RoomStatusEntry }` | Inventory toggle | Inventory toggle on page load |

---

## 7. TypeScript Interfaces

All types are in `lib/types/index.ts`. **Never define inline interfaces in component files.**

### Key interfaces (simplified)

```ts
interface Room {
  id: string;
  venueId: string;
  venueName: string;
  name: string;           // English
  nameVi?: string;        // Vietnamese
  description: string;
  descriptionVi?: string;
  district: string;
  address: string;
  addressVi?: string;
  capacity: number;
  pricePerHour: number;   // VND integer
  amenities: Amenity[];
  vibeTags: VibeTag[];
  images: string[];
  rating: number;         // 0-5
  reviewCount: number;
  verified: boolean;
  category: "team_hub" | "solo_nook";
  specs: RoomSpecs;
  specsVi?: Partial<RoomSpecs>;
  lat: number;
  lng: number;
}

interface TimeSlot {
  id: string;
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  available: boolean;
  price: number;          // VND per 30 min
}

interface Booking {
  id: string;             // UUID
  roomId: string;
  roomName: string;
  venueName: string;
  venueAddress: string;
  date: string;           // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  duration: number;       // hours
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  totalPrice: number;     // VND
  roomFee: number;
  platformFee: number;    // 10% commission
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  checkInQr: string;
  wifiPassword: string;
  createdAt: string;
  bookingCode?: string;   // DN-XXXXXX
  pointsRedeemed?: number;
  pointsEarned?: number;
  accessCode?: string;    // 4-char uppercase e.g. "A3F7" — used for partner check-in
  checkedInAt?: string;   // ISO timestamp set when partner confirms check-in
}

// Partner check-in log entry (stored in dinomad_checkins localStorage)
interface CheckInRecord {
  bookingId: string;
  guestName: string;
  roomName: string;
  checkedInAt: string;   // ISO timestamp
}

// Per-room availability status (stored in dinomad_room_status localStorage)
type RoomStatusReason = "walk_in" | "maintenance" | "private_event"

interface RoomStatusEntry {
  status: "available" | "busy";
  reason?: RoomStatusReason;
  timestamp: string;     // ISO timestamp
}

type BookingStatus  = "confirmed" | "pending" | "completed" | "cancelled" | "checked_in"
type PaymentMethod  = "vietqr" | "momo" | "zalopay" | "card"
type Amenity        = "wifi" | "projector" | "whiteboard" | "ac" | "tv" | "coffee" | "parking" | "printing" | "power_outlets" | "hdmi"
type VibeTag        = "ultra_quiet" | "discussion_friendly" | "cold_ac" | "natural_light" | "cozy" | "modern" | "rooftop" | "garden_view"
type AppRole        = "customer" | "supplier" | "admin"
```

---

## 8. State Management

The booking flow uses a single React Context (`lib/store/booking-store.tsx`).

### Context shape

```ts
interface BookingFlowState {
  selectedRoom: Room | null;
  selectedDate: string;            // "YYYY-MM-DD"
  selectedSlots: TimeSlot[];
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  paymentMethod: PaymentMethod;
  totalPrice: number;
  roomFee: number;
  platformFee: number;
  bookingId: string | null;
  confirmedBooking: Booking | null;
}
```

### Accessing state

```tsx
import { useBooking } from "@/lib/store/booking-store"

const { state, dispatch, myBookings, wishlist, toggleWishlist } = useBooking()
```

### Dispatch actions

```ts
dispatch({ type: "SET_ROOM",           payload: room })
dispatch({ type: "SET_DATE",           payload: "2026-06-15" })
dispatch({ type: "SET_SLOTS",          payload: selectedSlots })
dispatch({ type: "SET_GUEST_INFO",     payload: { guestName, guestPhone, guestEmail } })
dispatch({ type: "SET_PAYMENT_METHOD", payload: "momo" })
dispatch({ type: "CONFIRM_BOOKING" })   // saves to Supabase (logged-in) or localStorage (guest)
dispatch({ type: "RESET" })
```

### Pricing calculation

```ts
// Always use these constants — never hardcode
const PLATFORM_FEE_RATE = 0.10  // 10% matches BR-02

const roomFee     = room.pricePerHour * durationHours
const platformFee = Math.round(roomFee * PLATFORM_FEE_RATE)
const totalPrice  = roomFee + platformFee
```

---

## 9. Internationalization (i18n)

- **Supported locales:** `en`, `vi`
- **Default locale:** `vi`
- **URL pattern:** `/[locale]/...`
- **Dictionary files:** `lib/i18n/dictionaries/en.json`, `vi.json`

### Usage in components

```tsx
import { useTranslation } from "@/lib/i18n/context"

const { t, locale } = useTranslation()
// t("search.placeholder") → "Tìm kiếm không gian..." (vi) | "Search spaces..." (en)
```

**Every user-visible string must use `t()`. No hardcoded strings in JSX.**

Add new keys to **both** `en.json` and `vi.json` at the same time.

### Localized room data

```ts
import { getLocalizedRoom } from "@/lib/data/rooms"
const room = getLocalizedRoom(rawRoom, locale)
// room.name, room.description, room.address are now in the correct language
```

---

## 10. Component Architecture

### Layout components (`components/layout/`)

- `Header` — Logo, nav links, language switcher, auth state, mobile menu trigger
- `Footer` — Links, social, brand info
- `MobileNav` — Slide-out drawer navigation
- `AdminSidebar` — Admin dashboard sidebar

### Feature components

| Component | Location | Purpose |
|---|---|---|
| `RoomCard` | `components/room-card.tsx` | Room preview with image, rating, price |
| `TimeSlotPicker` | `components/time-slot-picker.tsx` | 30-min slot grid with range selection |
| `AmenityIcon` | `components/amenity-icon.tsx` | Maps amenity type → Lucide icon |
| `QrCode` | `components/qr-code.tsx` | Check-in QR display |
| `PriceDisplay` | `components/price-display.tsx` | VND-formatted price with breakdown |
| `VerifiedBadge` | `components/verified-badge.tsx` | "Verified" badge chip |
| `CountdownTimer` | `components/countdown-timer.tsx` | **5-min** checkout countdown |
| `LanguageSwitcher` | `components/language-switcher.tsx` | EN/VI toggle |

> **Checkout timer is 5 minutes (300 seconds)**, not 10. Always use `<CountdownTimer durationSeconds={5 * 60} />`.

### UI primitives (`components/ui/`)

60+ Radix UI components wrapped with Tailwind (shadcn/ui pattern). **Do not edit files in `components/ui/`** — they are managed by the shadcn CLI.

---

## 11. Styling System

### CSS variables (design tokens)

Defined in `app/globals.css`. Always use tokens — never raw color values.

```tsx
// ✅ Correct
<div className="bg-background text-foreground border-border">
<span className="text-muted-foreground">
<div className="bg-primary text-primary-foreground">

// ❌ Wrong
<div className="bg-white text-gray-900 border-gray-200">
<div className="bg-blue-600 text-white">
```

### Utility

```ts
import { cn } from "@/lib/utils"
cn("base-class", condition && "conditional-class", className)
```

### Standard patterns

```tsx
// Card
<div className="rounded-xl border bg-card p-4 shadow-sm">

// Section spacing
<section className="py-8 md:py-12">

// Container
<div className="container mx-auto px-4">

// Muted label
<span className="text-sm text-muted-foreground">
```

---

## 12. Key User Flows

### Guest booking

```
Landing Page
  → Search (district, capacity, amenities, price, date)
    → Room Detail (images, specs, reviews, availability)
      → Select Date + Time Slots (TimeSlotPicker)
        → Checkout (guest info form + payment selector)
          → Payment (VietQR / MoMo / ZaloPay / card) — 5-min countdown
            → Confirmation (booking_code + QR token + WiFi password)
              → My Bookings (history — Supabase for logged-in, localStorage for guests)
```

### Checkout state flow

```
SET_ROOM → SET_DATE → SET_SLOTS → SET_GUEST_INFO → SET_PAYMENT_METHOD → CONFIRM_BOOKING
```

### Partner check-in (current — mock/localStorage)

```
Partner Portal → Scanner (/partner/scanner)
  → Enter Booking ID + Access Code
    → Validate: credentials match + status=confirmed + date=today + within time window
      → Show booking summary (guest name, room, time)
        → Confirm Check-in
          → booking.status = "checked_in", checkedInAt = now
          → Writes to dinomad_bookings + dinomad_checkins localStorage
          → Dashboard pending check-ins widget updates on next load
```

**Validation rules (in order):**
1. Booking exists (merged mock + localStorage, localStorage wins on duplicate ID)
2. `accessCode` matches (case-insensitive, trims whitespace)
3. `status === "confirmed"` — specific error for `checked_in` / `cancelled` / `completed` / `pending`
4. `booking.date === today`
5. Check-in window: `startTime − 15 min` ≤ now ≤ `endTime + 30 min`

**When backend is ready:** replace the localStorage lookup with `POST /partner/bookings/:id/check-in { qr_code_token }` per `docs/backend-api-spec.md` Section 10.

---

## 13. What Needs Backend Integration

Replace mock data **one file at a time**. See `docs/backend-api-spec.md` for full API contract.

| Feature | Current | Needs | Status |
|---|---|---|---|
| Auth (signup/login/OAuth) | Supabase Auth | — | ✅ Done |
| User profile | Supabase `profiles` table | — | ✅ Done |
| Bookings (logged-in) | Supabase `bookings` table | — | ✅ Done |
| Wishlist | Supabase `wishlists` table | — | ✅ Done |
| Room listing & search | `lib/data/rooms.ts` | `GET /rooms` | 🔲 Planned |
| Room detail | `getRoomById()` | `GET /rooms/:id` | 🔲 Planned |
| Time slot availability | `generateTimeSlots()` (fake) | `GET /rooms/:id/slots?date=` | 🔲 Planned |
| Payment processing | Simulated | PayOS via `POST /bookings` | 🔲 Planned |
| Booking cancellation | UI only | `PATCH /bookings/:id/cancel` | 🔲 Planned |
| Partner dashboard metrics | Computed from mock + localStorage (`dinomad_bookings`, `dinomad_checkins`) | `GET /partner/stats` | 🟡 Mock-complete |
| Partner earnings tab | Mock `earningsData` from `lib/data/venues.ts` | `GET /partner/earnings` | 🟡 Mock-complete |
| Partner pending check-ins | Filtered from merged allBookings (today, confirmed, not in checkedInIds) | `GET /partner/bookings?status=confirmed&date=today` | 🟡 Mock-complete |
| Partner venue management | **Wired to real backend** via `lib/api/partner.ts` | `GET/POST /partner/venues`, `PATCH /partner/venues/:id`, `POST /partner/venues/:id/rooms`, `PATCH/DELETE /partner/rooms/:id` | ✅ Done |
| Partner inventory toggle | localStorage `dinomad_room_status` per room | `PATCH /partner/rooms/:id/status` | 🟡 Mock-complete (swap to `updateRoomStatus()` when needed) |
| Check-in verification | Full form with validation; writes to localStorage | `POST /partner/bookings/:id/check-in` | 🟡 Mock-complete |
| Admin analytics | Hardcoded chart data | `GET /admin/analytics` | 🔲 Planned |
| Admin tables | `lib/data/bookings.ts` | `GET /admin/bookings`, rooms | 🔲 Planned |
| Reviews | Static in room data | `POST /rooms/:id/reviews` | 🔲 Planned |

---

## 14. Known Issues & TODOs

### Build / Config

- `next.config.mjs` ignores TypeScript errors and disables image optimization — **fix before production**
- Missing `.env.example` file for environment variables — create when ready

### Authentication

- Admin and partner routes are not yet protected by server-side auth guards — anyone can navigate to them
- Role-based redirects after login are not fully implemented

### Data / State

- Room availability slots are deterministically generated (fake) — no real availability until `GET /rooms/:id/slots?date=` is wired up
- Guest bookings (not logged in) are lost on device change / cleared localStorage
- Platform fee (10%) is hardcoded in `booking-store.tsx` as `PLATFORM_FEE_RATE` — must come from `ConfigService` in backend when wired

### UI / UX

- QR camera on partner scanner page is a non-interactive placeholder — camera integration (`jsQR` or `react-qr-reader`) is deferred
- Some admin sub-pages render a "Coming Soon" placeholder
- Search query params are not reflected in the URL — direct links to filtered results don't work
- No error boundaries or loading states on most pages
- `CountdownTimer` in checkout is cosmetic — does not enforce the 5-min window on the server

### i18n

- Not all UI strings are translated — some hardcoded English strings remain in components
- Admin and partner portals are partially English-only

### Performance

- Images are `unoptimized` — enable Next.js Image Optimization before production
- No code splitting beyond Next.js defaults

---

---

## 15. Partner Portal Implementation Notes

> Added June 2026 on branch `feat/ViNTD`.

### Features implemented (mock-complete, no backend required)

#### 9.2 — Check-in Verification (`/partner/scanner`)

Full state machine in `app/[locale]/partner/scanner/page.tsx`:

```
idle → searching (400ms) → found | error → success
```

- Two inputs: **Booking ID** (case-normalised) + **Access Code** (4-char, uppercase)
- Validation order: credentials → status → date → time window
- On confirm: writes to `dinomad_bookings` and `dinomad_checkins` localStorage
- Recent scans: last 5 from `dinomad_checkins`, hydrated client-side

**Test credentials (today's date):**
| Booking ID | Access Code | Guest | Room |
|---|---|---|---|
| `BK-20260609-001` | `A3F7` | Hoang Nam | Focus Pod A, 09:00–11:00 |
| `BK-20260609-002` | `B9K2` | Bui Lan | Sunshine Meeting, 14:00–16:00 |

#### 10.1 — Dashboard Enhancements (`/partner`)

`app/[locale]/partner/page.tsx` now computes stats from merged mock + localStorage:

- **Check-ins Today** — union of `dinomad_checkins` + mock bookings with `status=checked_in` for today
- **Bookings Today** — `confirmed` + `checked_in` for today's date
- **Revenue Today** — sum of `totalPrice` for today's confirmed/checked-in bookings
- **Pending Check-ins** widget — today's `confirmed` bookings not in `checkedInIds`, sorted by `startTime`, each with "Verify Now" link to scanner
- **Upcoming Bookings** sidebar card — top 3 of the same set

#### 10.2 — Inventory Toggle (`/partner/inventory`)

`components/partner/inventory-toggle.tsx` enhanced:

- Room-level **"Busy"** button in card header (alongside existing slot-level Strict Mode)
- Clicking "Busy" opens inline reason panel: Walk-in Customer / Maintenance / Private Event
- "Block Room" confirms and persists `{ status, reason, timestamp }` to `dinomad_room_status[roomId]`
- When busy: all slots visually blocked, slot editing disabled, "Mark as Available" button shown
- State hydrated from localStorage in `useEffect` (no SSR mismatch)
- `e.stopPropagation()` on all toggle controls to prevent expand/collapse interference

#### 10.4 — Earnings Tab (`/partner/earnings`) — new page

`app/[locale]/partner/earnings/page.tsx`:

- 4 stat cards: This Month revenue, Last Month, Commission (10%), Pending Payout
- 14-day bar chart from `earningsData` in `lib/data/venues.ts`
- Per-booking breakdown table (booking ID, room/guest, date, room fee, −commission, net)
- Payout history with transfer reference and paid badge
- Added "Earnings" (`TrendingUp` icon) to partner nav in `layout.tsx`

### Data changes

**`lib/types/index.ts`** — new fields and types:
- `Booking.accessCode?: string` — 4-char check-in code
- `Booking.checkedInAt?: string` — ISO timestamp
- `CheckInRecord` interface
- `RoomStatusEntry` interface + `RoomStatusReason` type

**`lib/data/bookings.ts`** — added `accessCode` to 2 existing confirmed bookings; added 2 new bookings dated `2026-06-09`.

**`lib/i18n/dictionaries/en.json` + `vi.json`** — added ~35 keys under `"partner"` including all check-in error messages, scanner labels, pending check-ins, earnings, and inventory reason strings.

---

## 16. Room / Venue CRUD Implementation Notes

> Added June 2026. First full-stack partner feature — no dependency on the user booking flow.

### Backend: `backend/src/modules/rooms/`

New NestJS module following the exact pattern of `SuppliersModule`.

**Module structure:**
```
rooms/
├── rooms.module.ts            — registers both controllers + both services
├── venues.controller.ts       — @Controller("partner/venues")
├── venues.service.ts          — venue CRUD, room creation, ownership helpers
├── rooms.controller.ts        — @Controller("partner/rooms")
├── rooms.service.ts           — room update, status toggle, archive
└── dto/
    ├── create-venue.dto.ts
    ├── update-venue.dto.ts
    ├── create-room.dto.ts
    ├── update-room.dto.ts
    └── update-room-status.dto.ts
```

**All endpoints require** `JwtAuthGuard + RolesGuard` with `@Roles("supplier", "admin")`.

**Endpoints:**

| Method | Path | Handler |
|---|---|---|
| `GET` | `/partner/venues` | List partner's venues with nested rooms, amenities, vibe tags |
| `POST` | `/partner/venues` | Create venue (auto-looks up `supplier_id` from `supplier_members`) |
| `PATCH` | `/partner/venues/:venueId` | Update venue fields |
| `GET` | `/partner/venues/:venueId/rooms` | List rooms for one venue |
| `POST` | `/partner/venues/:venueId/rooms` | Create room + insert junction rows |
| `PATCH` | `/partner/rooms/:roomId` | Update room + **replace** amenities + vibe tags |
| `PATCH` | `/partner/rooms/:roomId/status` | Toggle `published` / `unavailable` / `archived` |
| `DELETE` | `/partner/rooms/:roomId` | Soft-delete: sets `status = "archived"` |

**Key service patterns:**

```ts
// Ownership helper — called before every write
private async getSupplierIdForUser(userId: string): Promise<string>
// queries supplier_members WHERE user_id = userId AND is_active = true

private async verifyVenueOwnership(venueId: string, userId: string): Promise<VenueRow>
// checks venue.supplier_id === user's supplier_id

// Create room — 3-step write (no Supabase transaction support, sequential inserts)
// 1. INSERT into rooms
// 2. INSERT into room_amenities (batch)
// 3. INSERT into room_vibe_tags (batch)

// Update room — replace strategy (delete-then-insert for junction tables)
// 1. UPDATE rooms
// 2. DELETE FROM room_amenities WHERE room_id = roomId
// 3. INSERT new amenities
// 4. DELETE FROM room_vibe_tags WHERE room_id = roomId
// 5. INSERT new vibe tags
```

**List venues query** (single relational select, no N+1):
```ts
supabase.admin.from("venues")
  .select(`*, rooms(id, name, capacity, price_per_hour, category, status, verified,
           noise_level, specs, specs_vi, created_at, updated_at,
           room_amenities(amenity), room_vibe_tags(vibe_tag))`)
  .eq("supplier_id", supplierId)
  .neq("status", "suspended")
```

All responses follow the same camelCase transformation pattern as `SuppliersService.toSupplierResponse()`.

### Frontend: `lib/api/partner.ts`

Typed fetch client wrapping all partner backend calls. Reads the Supabase session token via `createClient().auth.getSession()` and attaches `Authorization: Bearer <token>` on every request. Throws `Error` with the backend's `error.message` on non-2xx responses.

**Exported functions:**
```ts
getPartnerVenues()                          → ApiVenue[]   (with nested ApiRoom[])
createVenue(dto: CreateVenuePayload)        → ApiVenue
updateVenue(id, dto: UpdateVenuePayload)    → ApiVenue
createRoom(venueId, dto: CreateRoomPayload) → ApiRoom
updateRoom(roomId, dto: UpdateRoomPayload)  → ApiRoom
updateRoomStatus(roomId, status)            → ApiRoom
deleteRoom(roomId)                          → void
```

**Types** (`ApiVenue`, `ApiRoom`, `CreateVenuePayload`, `CreateRoomPayload`) are exported from this file and used by the venues page. They are **not** in `lib/types/index.ts` because they represent API response shapes, not core domain types.

### Frontend: `app/[locale]/partner/venues/page.tsx`

Fully rewritten. Key changes from the UI-only stub:

- `rooms` state is loaded from `getPartnerVenues()` on mount via `useEffect`
- Local `RoomFormData` shape tracks both venue fields (`venueName`, `address`, `district`) and room fields, with `venueId: string | null` to distinguish create vs update
- **Save on create:** calls `createVenue()` → `createRoom()` in sequence
- **Save on update:** calls `updateVenue()` and `updateRoom()` in parallel (both are independent)
- **Delete:** calls `deleteRoom()` (sets `status = "archived"`, soft delete)
- Loading state: 3-card skeleton grid while fetching
- Empty state: centered prompt with "Add Room" CTA
- Status badge: shows `draft` / `unavailable` / `archived` overlay on the card thumbnail
- All errors surfaced via `sonner` toast

### `app.module.ts` registration

```ts
import { RoomsModule } from "./modules/rooms/rooms.module"
// added to @Module({ imports: [..., RoomsModule] })
```

### `.env.local`

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
```

*Last updated: June 2026 — Room/Venue CRUD full-stack (feat/ViNTD)*
