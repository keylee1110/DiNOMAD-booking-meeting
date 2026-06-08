# DiNOMAD – Business Overview

> **Audience:** Business team, product managers, investors, stakeholders  
> **No technical background required**

---

## What is DiNOMAD?

DiNOMAD is an **online marketplace for booking meeting rooms and workspaces** in Ho Chi Minh City, Vietnam.

Think of it like Airbnb, but for professional spaces — solo nooks, team hubs, and meeting rooms — bookable by the hour.

---

## The Problem We Solve

| Pain Point | For Who |
|---|---|
| Hard to find available, professional spaces on short notice | Freelancers, remote workers, startups |
| Booking by phone or email is slow and unreliable | Any team needing a meeting room |
| Venue owners have idle spaces with no easy way to monetize them | Co-working spaces, offices, cafés |
| No standardized quality or verification of spaces | Users who need reliable WiFi, clean rooms |

---

## Our Users

### Guests (Bookers)
- Remote workers and digital nomads needing a quiet place to work
- Small teams needing a meeting room for 2–4 hours
- Professionals who need a private space for client calls or interviews
- Students needing a focused study environment

### Partners (Venue Owners)
- Co-working space operators in Ho Chi Minh City
- Hotel business centers with spare meeting room capacity
- Café owners with private rooms
- Any venue with underutilized professional spaces

### Admins (Internal Team)
- DiNOMAD operations team managing quality, onboarding, and revenue

---

## How It Works

### For Guests

```
1. Search          →  Find rooms by location, price, capacity, or amenities
2. Pick a time     →  Choose a date and 30-minute time slots
3. Book instantly  →  Pay via MoMo, ZaloPay, VietQR, or card
4. Show up & check in  →  Scan QR code at the venue
```

No phone calls. No back-and-forth emails. Booked in under 2 minutes.

### For Venue Partners

```
1. Apply to list   →  Submit venue details for review
2. Get verified    →  DiNOMAD team inspects and approves
3. List your rooms →  Set prices, availability, and amenities
4. Earn revenue    →  Get paid per booking, minus 10% platform commission
5. Check in guests →  Scan their QR code via our partner app
```

---

## Current Product Status

The current version is a **fully designed prototype** (frontend demo) with all key screens built:

| Area | Status |
|---|---|
| Guest booking flow (search → checkout → confirmation) | Designed & functional |
| Room detail pages with photos, specs, and reviews | Designed |
| Partner portal (dashboard, inventory, schedule) | Designed (read-only) |
| Admin dashboard (bookings, analytics, users) | Designed (read-only) |
| Vietnamese & English language support | Complete |
| Mobile-responsive design | Complete |
| Dark mode | Complete |

**What is not yet built:** Backend database, real payments, real authentication, live inventory.  
The next development phase will connect the designed frontend to a real backend.

---

## Room Categories

### Solo Nook
- 1–4 person capacity
- Quiet, focused individual work
- Usually a private booth or small room
- Lower price point

### Team Hub
- 5–20+ person capacity
- Meeting rooms, boardrooms, training rooms
- Equipment: projector/TV, whiteboard, video conferencing
- Higher price point

---

## Amenities We Track

WiFi speed, projector/TV, whiteboard, air conditioning, coffee, parking, printing.  
All rooms display amenities clearly so guests can filter by what they need.

---

## Pricing Model

### For Guests

- Rooms priced in **Vietnamese Dong (VND) per hour**
- Current mock pricing ranges: **100,000 – 450,000 VND/hour** (approx. $4–$18 USD)
- Booked in **30-minute increments**
- **10% platform fee** added at checkout

### For Partners

- Partners set their own hourly rates
- DiNOMAD earns a **10% commission** on each booking
- Partners keep 90% of booking revenue
- Earnings are tracked in the partner dashboard

---

## Service Area (Current)

All rooms are located in **Ho Chi Minh City**, Vietnam, across five districts:

- Quận 1 (District 1) — CBD, most business spaces
- Quận 3 (District 3)
- Bình Thạnh District
- Thủ Đức City
- Phú Nhuận District

---

## Quality & Trust

### Verified Badge
Rooms that pass DiNOMAD's in-person inspection receive a **"Verified" badge**. This signals to guests:
- The space matches the photos
- WiFi speed has been tested
- Cleanliness and equipment standards are met

### Ratings & Reviews
Guests can rate rooms after their stay (1–5 stars) and leave written reviews in both Vietnamese and English.

### Transparent Pricing
All fees are shown before payment. Guests see room fee + platform fee = total before confirming.

---

## Payment Methods Supported

| Method | Description |
|---|---|
| VietQR | Bank transfer via QR code (any Vietnamese bank) |
| MoMo | Vietnam's most popular e-wallet |
| ZaloPay | Popular e-wallet by Zalo (Zalo is Vietnam's dominant messaging app) |
| Card | International credit/debit card |

---

## Key Metrics to Track (Future KPIs)

| Metric | Why It Matters |
|---|---|
| Booking Conversion Rate | % of searches → confirmed bookings |
| Average Booking Value | Revenue per transaction |
| Room Utilization Rate | % of available hours that get booked |
| Partner Net Promoter Score | Partner satisfaction with the platform |
| Guest Repeat Booking Rate | Loyalty indicator |
| Time-to-Book | How fast users complete a booking |
| Platform GMV | Gross Merchandise Value (total booking value) |
| Net Revenue | GMV × 10% commission |

---

## Competitive Landscape

| Platform | Focus | Key Difference |
|---|---|---|
| **DiNOMAD** | Meeting rooms & workspaces, HCMC | Instant booking, by-the-hour, Vietnamese payment methods |
| Toong Coworking | Coworking memberships | Monthly membership, not hourly |
| Dreamplex | Premium coworking | High price, no guest marketplace |
| ShareDesk / Deskpass | Global coworking | Not Vietnam-focused, USD pricing |
| Direct venue booking | Varies | Phone/email, no real-time availability |

**DiNOMAD's advantage:** Real-time availability, instant confirmation, local payment methods (MoMo/ZaloPay), bilingual (EN/VI), verified quality standards.

---

## Expansion Opportunities

1. **More cities** — Hanoi, Da Nang as natural next markets
2. **Hourly café bookings** — partner with premium cafés
3. **Corporate accounts** — enterprise plan with invoicing and team management
4. **Event spaces** — scale up to half-day and full-day bookings
5. **Recurring bookings** — weekly fixed-time bookings for regular users
6. **Reviews & photos** — user-generated content to build trust faster

---

## What the Development Team Is Building Next

The business team can expect these features to go live in the next development phase:

1. **Real room availability** — live slot booking with conflict prevention
2. **Payment processing** — live MoMo, ZaloPay, VietQR integration
3. **User accounts** — register, log in, booking history synced to account
4. **Partner onboarding** — partners can apply and manage listings themselves
5. **Admin tools** — real-time booking management and analytics
6. **QR check-in** — functional check-in via partner scanner

---

## Glossary

| Term | Meaning |
|---|---|
| **Slot** | A 30-minute bookable time block |
| **Platform fee** | DiNOMAD's 10% commission taken from each booking |
| **Partner** | A venue owner who lists spaces on DiNOMAD |
| **Verified** | A room that has passed DiNOMAD's quality inspection |
| **Solo Nook** | A small, quiet workspace for 1–4 people |
| **Team Hub** | A larger meeting room for groups |
| **QR Check-in** | Guest shows a QR code at the venue; partner scans to confirm arrival |
| **GMV** | Gross Merchandise Value — total money transacted through the platform |
| **VND** | Vietnamese Dong (₫), the currency used for all pricing |

---

*Last updated: May 2026*
