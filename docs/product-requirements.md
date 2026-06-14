# DiNOMAD — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Audience:** Developers, QA, product team  
> **Purpose:** Defines every feature, its acceptance criteria, edge cases, and which phase it ships in.  
> A feature is only "done" when ALL its acceptance criteria pass.

---

## How to Read This Document

- **AC** = Acceptance Criteria — the exact conditions that must be true for a feature to be complete
- **Edge Case** = unusual but real scenario that must be handled
- **Phase 1** = MVP, must ship before launch
- **Phase 2** = post-launch, first growth sprint
- **Out of Scope** = explicitly not being built

---

## Table of Contents

1. [Search & Discovery](#1-search--discovery)
2. [Room Detail](#2-room-detail)
3. [Time Slot Selection](#3-time-slot-selection)
4. [Checkout & Guest Info](#4-checkout--guest-info)
5. [Payment Flow](#5-payment-flow)
6. [Booking Confirmation](#6-booking-confirmation)
7. [My Bookings & Guest Identity](#7-my-bookings--guest-identity)
8. [Cancellation & Refund](#8-cancellation--refund)
9. [Check-in Flow](#9-check-in-flow)
10. [Partner Portal](#10-partner-portal)
11. [Partner Onboarding](#11-partner-onboarding)
12. [Admin Dashboard](#12-admin-dashboard)
13. [Notifications](#13-notifications)
14. [Authentication](#14-authentication)
15. [Loyalty Points](#15-loyalty-points)
16. [Feature Phase Summary](#16-feature-phase-summary)

---

## 1. Search & Discovery

**Linked requirements:** BR-01, FR-01, FR-02, UR-01, UR-02  
**Phase:** 1

### Features

#### 1.1 Text Search
**AC:**
- [ ] User can search by keyword (room name, venue name, district, address)
- [ ] Search is case-insensitive
- [ ] Partial matches are returned (e.g. "work" returns "The Work Loft")
- [ ] Empty search returns all available rooms

#### 1.2 Filter: District
**AC:**
- [ ] User can filter by one district at a time
- [ ] Dropdown lists only districts that have at least one active room
- [ ] Selecting "All districts" clears the filter

#### 1.3 Filter: Capacity
**AC:**
- [ ] User can input minimum capacity (e.g. "4 people")
- [ ] Returns rooms where `room.capacity >= input`
- [ ] Input must be a positive integer

#### 1.4 Filter: Amenities
**AC:**
- [ ] User can select multiple amenities (WiFi, Projector, Whiteboard, AC, TV, Coffee, Parking, Printer)
- [ ] Filter is AND logic — room must have ALL selected amenities
- [ ] Amenity icons are shown on filter chips

#### 1.5 Filter: Price Range
**AC:**
- [ ] User can set min and/or max price per hour (VND)
- [ ] Returns rooms where `minPrice <= room.pricePerHour <= maxPrice`
- [ ] If only min is set, max is unbounded (and vice versa)

#### 1.6 Sort
**AC:**
- [ ] User can sort by: Price (low→high), Price (high→low), Rating, Newest
- [ ] Default sort: Rating (highest first)

#### 1.7 Date Filter
**AC:**
- [ ] User can filter by date to see only rooms with at least one available slot on that date
- [ ] Dates in the past are disabled in the date picker

#### 1.8 Results Display
**AC:**
- [ ] Each room card shows: name, district, price/hour, rating, capacity, top 3 amenity icons, "Verified" badge if verified, "X slots left today" if < 5 slots remain
- [ ] Pagination or infinite scroll for > 12 results
- [ ] Loading skeleton shown while fetching

#### 1.9 Empty State
**AC:**
- [ ] If 0 results: show friendly message specifying which filter caused it
- [ ] Suggest removing one filter (e.g. "Try removing the projector filter")
- [ ] Never show a blank white page

**Edge Cases:**
- User applies filters that return 0 results → show empty state, not error
- User types a valid district with no rooms → same empty state
- Network error during search → show "Something went wrong, tap to retry"

---

## 2. Room Detail

**Linked requirements:** FR-03, P03  
**Phase:** 1

#### 2.1 Photo Gallery
**AC:**
- [ ] Displays 3–5 room photos in a swipeable carousel
- [ ] Works on mobile (swipe gesture) and desktop (arrow buttons)
- [ ] First image is shown as the hero/thumbnail in search results

#### 2.2 Room Information
**AC:**
- [ ] Shows: name, venue name, address, district, capacity, price per hour
- [ ] Shows "Verified" badge prominently if `room.verified === true`
- [ ] Shows all amenities with icons
- [ ] Shows vibe tags (e.g. "Cold AC", "Discussion Friendly")
- [ ] Shows detailed specs (TV model, HDMI, WiFi speed, whiteboard, AC)

#### 2.3 Reviews
**AC:**
- [ ] Shows average rating (1 decimal) and total review count
- [ ] Shows individual reviews: reviewer name, rating stars, comment, date
- [ ] Shows both English and Vietnamese comments if available

#### 2.4 Google Maps Link
**AC:**
- [ ] "Get Directions" button opens Google Maps with room coordinates
- [ ] Link format: `https://www.google.com/maps?q={lat},{lng}`
- [ ] Opens in new tab on desktop, maps app on mobile

**Edge Cases:**
- Room has no coordinates → hide the directions button
- Room has no reviews → show "Be the first to review" placeholder

---

## 3. Time Slot Selection

**Linked requirements:** FR-04, UR-02  
**Phase:** 1

#### 3.1 Slot Grid Display
**AC:**
- [ ] Shows 30-minute slots from 07:00 to 22:00 (30 slots total)
- [ ] Three visual states: Available (light), Booked (grey/strikethrough), Selected (blue/filled)
- [ ] Legend shown: Available / Booked / Selected

#### 3.2 Continuous Range Selection (REQUIRED — replaces individual slot clicks)
**AC:**
- [ ] First click sets the start time — slot turns blue
- [ ] Subsequent hover over later slots previews the range in light blue
- [ ] Second click sets the end time — entire range between start and end is selected
- [ ] All slots between start and end are automatically selected (no gaps)
- [ ] Clicking the start time again resets the selection
- [ ] User cannot select a range that includes a booked slot — show inline error: "A slot in this range is unavailable"
- [ ] User cannot select a range in the past (earlier than current time if today is selected)

#### 3.3 Duration Shortcuts
**AC:**
- [ ] Shortcut buttons: "1 hour", "2 hours", "3 hours", "Half day (4h)"
- [ ] User selects a start time, then taps a shortcut → range auto-filled
- [ ] If auto-fill hits a booked slot → show error and clear selection

#### 3.4 Live Summary Bar
**AC:**
- [ ] Always visible below the slot grid once at least 1 slot is selected
- [ ] Shows: "09:00 → 11:00 · 2 hours · 500,000₫"
- [ ] Price updates in real time as selection changes
- [ ] "Continue to Checkout" button only enabled when ≥ 1 slot selected (minimum 30 min)

#### 3.5 Date Picker
**AC:**
- [ ] User can pick any date from today up to 30 days in the future
- [ ] Past dates are disabled
- [ ] Changing date resets the slot selection
- [ ] Selected date is visually highlighted on the calendar

**Edge Cases:**
- User selects a date where all slots are booked → show "Fully booked on this date — try another day"
- User selects today → slots before the current time are disabled (can't book the past)
- Only 1 slot left at end of day (e.g. 21:30) → user can still book that single slot

---

## 4. Checkout & Guest Info

**Linked requirements:** FR-05, FR-06, UR-03, P04  
**Phase:** 1

#### 4.1 Booking Summary
**AC:**
- [ ] Shows: room name, venue, date, start–end time, duration
- [ ] Shows price breakdown: Room fee + Platform fee (10%) = Total
- [ ] All amounts in VND, formatted with dots (e.g. 500.000₫)
- [ ] Summary is read-only — user cannot change it here (use "Back" to change)

#### 4.2 Guest Info Form
**AC:**
- [ ] Full Name: required, min 2 characters
- [ ] Phone Number: required, must be valid Vietnamese phone (10–11 digits, starts with 0)
- [ ] Email: optional, must be valid format if provided
- [ ] Form shows inline error on each field when invalid
- [ ] "Proceed to Payment" button disabled until required fields are valid

#### 4.3 Soft Lock (Slot Lock)
**AC:**
- [ ] When user clicks "Proceed to Payment", slot is locked for **5 minutes** on the server
- [ ] A countdown timer (5:00 → 0:00) is shown clearly on the page
- [ ] When timer reaches 0:00 → show modal: "Your session timed out. Slot has been released." → redirect to room detail
- [ ] If slot was taken by someone else between search and checkout → show: "Sorry, this slot was just booked. Please choose another time." → redirect to room detail

**Edge Cases:**
- User opens two tabs with the same booking → second tab should fail the lock
- User refreshes page during checkout → timer continues from remaining time (not reset)
- Network drops when creating lock → show error, do not proceed to payment

---

## 5. Payment Flow

**Linked requirements:** FR-07, UR-04, P05  
**Phase:** 1

#### 5.1 Payment Method Selection
**AC:**
- [ ] User can choose: VietQR, MoMo, ZaloPay, ATM/Visa card
- [ ] Selected method is highlighted visually
- [ ] "Confirm & Pay" button only enabled when a method is selected

#### 5.2 Payment Initiation
**AC:**
- [ ] On confirm: app calls backend → backend creates PayOS payment link
- [ ] Loading state shown while payment link is being created ("Preparing your payment...")
- [ ] On success: user is redirected to PayOS checkout page (or QR is shown for VietQR)

#### 5.3 Waiting for Payment State
**AC:**
- [ ] After redirect back (or on payment page): show "Waiting for payment confirmation..."
- [ ] App polls backend every 3 seconds for booking status update
- [ ] Max polling duration: 5 minutes (matches soft lock)
- [ ] On confirmed payment: redirect to `/checkout/success`
- [ ] On timeout (5 min, no payment): redirect to `/checkout/cancel` with message "Payment not received — your slot has been released"

#### 5.4 Payment Success
**AC:**
- [ ] Booking status updated to `confirmed` in database
- [ ] Slot lock released
- [ ] Confirmation SMS/Zalo sent to guest phone automatically
- [ ] User redirected to confirmation page

#### 5.5 Payment Failure
**AC:**
- [ ] If PayOS returns failure/cancellation: show "Payment was not completed"
- [ ] Offer user to try again with same or different payment method
- [ ] Slot lock is NOT released on failure — user keeps their 5-minute window to retry
- [ ] If user retries within the lock window: create new transaction, mark old as `failed`

#### 5.6 Payment Cancel
**AC:**
- [ ] If user clicks "Cancel" on the PayOS page → redirected to `/checkout/cancel`
- [ ] Show clear message: slot has been released
- [ ] Offer "Book Again" button back to the room

**Edge Cases:**
- PayOS webhook arrives before user is redirected back → booking still confirmed correctly
- Webhook never arrives (PayOS outage) → admin can manually confirm from admin dashboard
- User pays twice (double submission) → second payment rejected, first one is valid
- User's bank app crashes mid-payment → slot lock expires, slot released, user must restart

---

## 6. Booking Confirmation

**Linked requirements:** FR-08, P06  
**Phase:** 1

#### 6.1 Confirmation Page Content
**AC:**
- [ ] Shows success animation (confetti or checkmark)
- [ ] Shows: Booking ID (e.g. BK-A3F9K2), Access Code (e.g. K7P4)
- [ ] Shows: room name, venue name, full address, date, time
- [ ] Shows: WiFi password for the room
- [ ] Shows: "Get Directions" link (Google Maps)
- [ ] Shows: "Share with Team" button (generates Zalo share link)

#### 6.2 Access Code Display
**AC:**
- [ ] Access Code displayed large and clearly (it is the check-in credential)
- [ ] "Copy" button next to Access Code
- [ ] Booking ID also copyable

#### 6.3 Share with Team
**AC:**
- [ ] "Share with Team" generates a Zalo share URL with booking summary text
- [ ] Share text includes: room name, address, date, time, WiFi password
- [ ] Does NOT include access code in the share (security — only the booker should have it)

**Edge Cases:**
- User closes the confirmation page — they can still access it via the magic link in their SMS
- Confirmation page refreshed — still shows the same booking (not a new booking)

---

## 7. My Bookings & Guest Identity

**Linked requirements:** UR-09, UR-10  
**Phase:** 1

#### 7.1 Guest Magic Link
**AC:**
- [ ] After booking confirmed: SMS sent to guest phone with link: `/bookings/{id}?token={guestToken}`
- [ ] Token is valid for 30 days
- [ ] Anyone with the link can view the booking (this is intentional — they share it with team)
- [ ] Token is NOT the access code — two separate values

#### 7.2 My Bookings Page
**AC:**
- [ ] Shows all bookings associated with the authenticated user (or guest phone number)
- [ ] Each booking shows: room name, date, time, status badge, total price
- [ ] Bookings sorted by date (newest first)
- [ ] Status badge colors: confirmed (green), pending (yellow), completed (grey), cancelled (red), checked_in (blue)

#### 7.3 Booking Detail View
**AC:**
- [ ] Shows all confirmation page info (Booking ID, Access Code, WiFi, address)
- [ ] Shows current status
- [ ] Shows refund status if cancelled
- [ ] "Cancel Booking" button visible if: status is `confirmed` AND session has not started yet

**Edge Cases:**
- User clears browser → they can still access booking via SMS magic link
- Guest books same phone twice → both bookings appear under the same phone lookup

---

## 8. Cancellation & Refund

**Linked requirements:** UR-09, UR-10, FR-12, FR-13  
**Phase:** 1

#### 8.1 Refund Policy (non-negotiable, hardcoded in backend)

| When Cancelled | Refund to Guest | Partner Earns |
|---|---|---|
| > 24h before start | 100% | 0% |
| 4h – 24h before start | 70% | 20% of total |
| < 4h before start | 0% | 80% of total |
| Venue cancels (any time) | 100% | 0% + penalty flag |

#### 8.2 Guest Cancellation Flow
**AC:**
- [ ] "Cancel Booking" button only shown for `confirmed` bookings that haven't started
- [ ] Before confirmation: show refund amount calculated from current time
  - "Cancel now → you receive 385,000₫ back (70% refund) · Session starts in 8 hours"
- [ ] Require explicit confirmation tap ("Yes, cancel my booking")
- [ ] On confirm: booking status → `cancelled`, refund triggered immediately
- [ ] Show updated status: "Cancelled — refund of 385,000₫ is being processed (1–3 business days)"
- [ ] SMS/Zalo notification sent automatically

#### 8.3 Cannot Cancel Cases
**AC:**
- [ ] Button hidden if `status === 'checked_in'` or `status === 'completed'`
- [ ] Button hidden if session start time has already passed
- [ ] If 0% refund applies: show explicit warning before confirmation
  - "You will receive NO refund. Session starts in 2 hours. Are you sure?"

#### 8.4 Venue Cancellation (Admin-assisted in Phase 1)
**AC:**
- [ ] Admin can cancel a booking from admin dashboard on behalf of a venue
- [ ] This triggers 100% refund regardless of timing
- [ ] Guest receives SMS: "Your booking was cancelled by the venue. Full refund of X₫ is processing."
- [ ] Venue's cancellation count is incremented (for future penalty system)

#### 8.5 Refund Status Display
**AC:**
- [ ] After cancellation: show `refund_status` on booking detail
  - `processing` → "Refund processing (1–3 business days)"
  - `completed` → "Refunded on DD/MM/YYYY"
  - `none` → "No refund (cancelled < 4h before session)"

**Edge Cases:**
- Guest tries to cancel a booking that's already `cancelled` → show error "This booking is already cancelled"
- PayOS refund API fails → booking still marked `cancelled`, admin is alerted, manual refund processed
- Guest cancels 1 minute before the 4h cutoff → 70% applies (backend uses exact timestamp)

---

## 9. Check-in Flow

**Linked requirements:** FR-08, BR-04  
**Phase:** 1

#### 9.1 Guest Side — Showing Credentials
**AC:**
- [ ] Booking detail / confirmation page shows Booking ID and Access Code prominently
- [ ] Access Code is 4 uppercase alphanumeric characters, no ambiguous chars (0/O, 1/I/l)
- [ ] Guest can copy either value with one tap

#### 9.2 Partner Side — Verification
**AC:**
- [ ] Partner enters Booking ID + Access Code in check-in form
- [ ] System validates: both fields match a booking record
- [ ] System validates: booking.date = today
- [ ] System validates: booking.status = `confirmed`
- [ ] On success: show booking summary for partner to confirm:
  - Guest name, room, time slot
  - "Confirm Check-in" button
- [ ] On confirm: booking.status → `checked_in`, timestamp recorded

#### 9.3 Check-in Error States
**AC:**
- [ ] Wrong Booking ID or Access Code → "Invalid credentials. Please check again."
- [ ] Correct booking but wrong date → "This booking is for [date], not today."
- [ ] Already checked in → "Already checked in at [time]."
- [ ] Booking is cancelled → "This booking has been cancelled."
- [ ] Booking is for a different room in this venue → "This booking is for [other room], not [this room]."
- [ ] Session ended (past end_time) → "This session has already ended."

#### 9.4 Check-in Window
**AC:**
- [ ] Check-in allowed from **15 minutes before** start_time until **30 minutes after** end_time
- [ ] Outside this window: show "Check-in not available yet. Session starts at [time]."

**Edge Cases:**
- Partner types a lowercase booking ID → system accepts and normalizes to uppercase
- Guest shows a screenshot with pixelated text → partner types manually (this is the fallback design)
- Network drops during check-in → show retry button, do not double-check-in

---

## 10. Partner Portal

**Phase:** 1 (core features), 2 (advanced)

#### 10.1 Partner Dashboard
**AC:**
- [ ] Shows today's stats: bookings count, revenue, check-ins completed
- [ ] Shows this week's vs last week's performance
- [ ] Shows upcoming bookings (next 3) with guest name and time
- [ ] Shows pending check-ins (confirmed bookings that haven't checked in yet)

#### 10.2 Inventory Toggle (FR-10)
**AC:**
- [ ] Partner can toggle any of their rooms to "Available" or "Busy"
- [ ] When toggled to "Busy": room hidden from search results immediately
- [ ] When toggled to "Available": room appears in search results immediately
- [ ] Toggle state persisted — survives page refresh
- [ ] Reason field (optional): "Walk-in customer", "Maintenance", "Private event"

#### 10.3 Booking Schedule
**AC:**
- [ ] Calendar view showing all bookings for the partner's rooms
- [ ] Can filter by room
- [ ] Clicking a booking shows: guest name, phone, time, status
- [ ] Can switch between day view and week view

#### 10.4 Earnings Tab
**AC:**
- [ ] Shows total earned this month and last month
- [ ] Shows per-booking breakdown: date, room, guest, amount earned, platform fee deducted
- [ ] Shows payout history: date paid, amount, transfer reference
- [ ] Shows "Pending payout" amount (completed bookings not yet settled)

#### 10.5 Venue & Room Management (Phase 2)
**AC (Phase 2):**
- [ ] Partner can edit venue name, address, phone, photos
- [ ] Partner can add/edit/deactivate rooms
- [ ] Partner can set room price, capacity, amenities, availability hours
- [ ] Partner can upload room photos (max 5 per room, max 5MB each, JPG/PNG)

---

## 11. Partner Onboarding

**Phase:** 1 (application form), 2 (self-service setup)

#### 11.1 "Become a Partner" Public Page
**AC:**
- [ ] Accessible from main navigation ("List your space" link)
- [ ] Shows benefits: earn revenue, control schedule, verified badge
- [ ] Shows commission structure (DiNOMAD takes 10%)
- [ ] Application form below

#### 11.2 Application Form
**AC:**
- [ ] Fields: Full name, phone, email, venue name, venue address, district, short description
- [ ] Phone validation: Vietnamese format
- [ ] On submit: application stored with `status: pending`, admin notified
- [ ] Applicant sees: "Application received! We'll contact you within 2 business days."

#### 11.3 Admin Review
**AC:**
- [ ] Admin sees new applications in admin dashboard with `pending` badge
- [ ] Admin can approve → partner account created, welcome message sent via Zalo/email
- [ ] Admin can reject with a reason → applicant notified with reason
- [ ] Admin can add notes to the application (internal)

---

## 12. Admin Dashboard

**Phase:** 1 (read + basic actions), 2 (full management)

#### 12.1 Stats Overview
**AC:**
- [ ] Shows today, this week, this month: total bookings, total revenue, new users, avg rating
- [ ] Shows pending partner applications count (clickable badge)
- [ ] Shows cancelled bookings today with refund amounts

#### 12.2 Bookings Table
**AC:**
- [ ] All bookings, paginated (20 per page)
- [ ] Searchable by: Booking ID, guest name, guest phone
- [ ] Filterable by: status, date range, room, venue
- [ ] Each row shows: ID, guest, room, date/time, amount, status, payment method
- [ ] Admin can click a booking to see full detail
- [ ] Admin can manually update status (for edge cases: payment confirmed manually, etc.)

#### 12.3 Room Management
**AC:**
- [ ] Table of all rooms across all partners
- [ ] Admin can verify a room (`verified: true`) — adds the Verified badge
- [ ] Admin can deactivate a room (hides from search)
- [ ] Admin can view room's booking history

#### 12.4 Payout Management
**AC:**
- [ ] Table showing pending payouts per partner per week
- [ ] Admin selects a partner → sees all included bookings + amounts
- [ ] Admin enters bank transfer reference → marks payout as `paid`
- [ ] Partner's earnings tab automatically updated

---

## 13. Notifications

**Linked requirements:** FR-11, UR-06  
**Phase:** 1 (SMS), 2 (Zalo OA, email)

#### 13.1 Booking Confirmation to Guest
**AC:**
- [ ] Sent immediately after payment confirmed
- [ ] Channel: SMS (Phase 1), Zalo + email (Phase 2)
- [ ] Content: room name, address, date/time, Booking ID, Access Code, magic link
- [ ] Language: Vietnamese

#### 13.2 15-Minute Reminder to Guest
**AC:**
- [ ] Sent 15 minutes before session start time
- [ ] Content: "Your session at [room] starts in 15 minutes. Address: [address]. Access code: [code]"
- [ ] Only sent if booking status is `confirmed` (not already checked_in or cancelled)

#### 13.3 New Booking Alert to Partner
**AC:**
- [ ] Sent immediately when a booking is confirmed for their room
- [ ] Content: "New booking! [Guest name], [Room], [Date] [Time]"
- [ ] Channel: Zalo OA preferred, SMS fallback

#### 13.4 Cancellation Notification
**AC:**
- [ ] Guest receives cancellation confirmation with refund amount and timeline
- [ ] Partner receives notification that a booking was cancelled

---

## 14. Authentication

**Phase:** 1

#### 14.1 Phone OTP Login (for Registered Users)
**AC:**
- [ ] User enters Vietnamese phone number
- [ ] OTP sent via SMS (6-digit code, valid for 5 minutes)
- [ ] On correct OTP: user logged in, JWT issued
- [ ] On wrong OTP: show error, allow retry (max 3 attempts, then 30s cooldown)

#### 14.2 Guest Checkout (No Account Required)
**AC:**
- [ ] Guest can complete full booking flow with only name + phone (no registration)
- [ ] After booking: magic link sent to phone for booking access
- [ ] No password ever required for guests

#### 14.3 Partner & Admin Login
**AC:**
- [ ] Partners and admins log in with email + password (created by admin for them)
- [ ] Wrong credentials: show "Incorrect email or password" (same message for both — no enumeration)
- [ ] Session expires after 7 days of inactivity

#### 14.4 Route Protection
**AC:**
- [ ] `/partner/*` routes: redirect to login if not authenticated as `partner` or `admin`
- [ ] `/admin/*` routes: redirect to login if not authenticated as `admin`
- [ ] Guest routes (`/`, `/search`, `/rooms/*`, `/checkout/*`): always public

---

## 15. Loyalty Points

**Phase:** 2

#### 15.1 Earning Points
**AC (Phase 2):**
- [ ] Guest earns 1 point per successful check-in
- [ ] Points only awarded when booking reaches `completed` status
- [ ] Points visible on guest profile/my bookings page
- [ ] Phase 1: `qualifying_checkins` counter is silently tracked in DB (no UI)

#### 15.2 Redeeming Points
**AC (Phase 2):**
- [ ] At checkout: if user has ≥ 5 points, show "Use points for discount"
- [ ] 1 point = 10,000₫ discount (example rate — confirm before launch)
- [ ] Max redemption: 50% of booking total
- [ ] Points deducted immediately on booking confirm (not payment)
- [ ] Points restored if booking is cancelled with full refund

---

## 16. Feature Phase Summary

### Phase 1 — Must Ship for Launch

| Feature | Priority |
|---|---|
| Search with filters (district, capacity, amenities, price, date) | P0 |
| Room detail page (photos, specs, reviews, map link) | P0 |
| Continuous range time slot selection | P0 |
| 3-step checkout (info → payment → confirm) | P0 |
| PayOS payment integration (VietQR + MoMo) | P0 |
| 5-minute soft slot lock | P0 |
| Booking confirmation with Access Code | P0 |
| Guest magic link via SMS | P0 |
| Check-in via Booking ID + Access Code | P0 |
| Partner inventory toggle | P0 |
| Partner booking schedule view | P0 |
| Guest cancellation with 3-tier refund policy | P1 |
| Admin booking management | P1 |
| Admin payout management (manual) | P1 |
| Partner onboarding application form | P1 |
| SMS notifications (confirmation + reminder) | P1 |
| My Bookings page | P1 |

### Phase 2 — Post-Launch

| Feature | Notes |
|---|---|
| Zalo OA notifications | Replace SMS |
| Partner self-service room management | Photo upload, edit specs |
| Loyalty points (earn + redeem) | Use `qualifying_checkins` already tracked |
| Flash deals / time-based discounts | For BR-05 student pricing |
| Google Maps embedded in search | Currently only a link |
| Bill splitting ("Share Booking") | FR-09 — deferred from spec |
| Review system (post-stay prompt) | Auto-triggered 30 min after session |
| Automated partner payouts | Via bank API |
| VNPAY payment method | Per UR-04 |

### Out of Scope (Explicitly)

- Mobile app (web-first per requirements concern #2)
- International payment (Stripe, PayPal)
- Room rating manipulation / fraud detection
- Live chat between guest and partner
- Recurring/subscription bookings

---

## Open Questions (Resolve Before Building)

| # | Question | Who Decides | Status |
|---|---|---|---|
| 1 | Exact refund percentages: 100% / 70% / 0% or 100% / 50% / 0%? | Business | ⏳ Open |
| 2 | Minimum booking duration: 30 min or 1 hour? | Product | ⏳ Open |
| 3 | How far in advance can a room be booked? (currently: 30 days) | Product | ⏳ Open |
| 4 | Does the platform fee apply to cancelled bookings? | Business | ⏳ Open |
| 5 | What happens to points if a partial refund is issued? | Product | ⏳ Open |
| 6 | SMS provider: which one? (Twilio, ESMS, Vietguys, etc.) | Tech | ⏳ Open |
| 7 | Is guest email required or truly optional? | Business | ⏳ Open |
| 8 | Can a guest book the same room twice on the same day? | Product | ⏳ Open |

---

*Last updated: May 2026*
