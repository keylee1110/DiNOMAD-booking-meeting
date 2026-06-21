# Server-side Hold 5 Minutes

## Goal
Implement a 5-minute server-side hold (soft lock) for selected room booking slots when a user enters the checkout page, preventing other users from booking the same slot, with auto-cleanup and proactive release.

## Tasks
- [ ] **Task 1: Create Bookings Module in NestJS Backend** → Create `bookings.module.ts`, `bookings.controller.ts`, and `bookings.service.ts` in `backend/src/modules/bookings` to handle `PATCH /bookings/:id/cancel-pending`. Verify: NestJS compiles without errors.
- [ ] **Task 2: Register Bookings Module** → Register `BookingsModule` in `backend/src/app.module.ts`. Verify: NestJS starts successfully.
- [ ] **Task 3: Implement Frontend API client** → Create `lib/api/bookings.ts` in Next.js to fetch `PATCH /api/bookings/:id/cancel-pending`. Verify: Compiles in frontend.
- [ ] **Task 4: Update Checkout Page (Pending Booking on Load)** → Modify `app/[locale]/(main)/checkout/page.tsx` to insert a pending booking into Supabase immediately upon page load (if user is logged in). Verify: A `pending` booking is created in database `bookings` table as soon as the checkout page opens.
- [ ] **Task 5: Implement Session Cache for Active Hold** → Store active hold info (`bookingId`, `bookingCode`, `roomId`, `date`, `slots`, `createdAt`) in `sessionStorage` (`dinomad_active_hold`) and check it on load to avoid duplicate booking records on page refresh. Verify: Refreshing the checkout page retains the same `bookingId` and countdown timer state without creating new bookings in DB.
- [ ] **Task 6: Update Payment Submission & Countdown** → Update `handleProceedPayment` in `checkout/page.tsx` to update total amounts/points and open the dialog, instead of inserting a new record. Make the countdown timer run continuously from page load. Verify: Payment dialog displays the correct VietQR code and counts down accurately.
- [ ] **Task 7: Handle Proactive Release & Unmount** → Implement active cancel on explicit cancellation actions and on component unmount (using refs to track if confirmed) to immediately release slots when the user leaves the checkout page. Verify: Leaving the checkout page or clicking "Cancel" immediately sets status to `cancelled` in database.

## Done When
- [ ] Booking is created on checkout page load and locked for other users (due to `bookings_no_overlap` constraint).
- [ ] 5-minute timer counts down from page load, synced with backend creation time.
- [ ] Slots are successfully released proactively on cancel/unmount, or automatically after 5 minutes via cron/cleanup.
