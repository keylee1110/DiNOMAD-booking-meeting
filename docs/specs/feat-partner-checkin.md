# Spec: Partner Check-in Verification

**Status:** `done`  
**PRD ref:** §9.2, §9.3, §9.4  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-09

---

## Overview

Partners need to verify a guest's booking before letting them into a room.  
The guest presents a Booking ID and a 4-character Access Code (shown on their confirmation page).  
The partner enters both into the scanner form; the system validates and marks the booking as `checked_in`.

---

## Acceptance Criteria

- [x] Partner enters Booking ID + Access Code in check-in form
- [x] System validates: both fields match a booking record
- [x] System validates: `booking.date === today`
- [x] System validates: `booking.status === "confirmed"`
- [x] On success: show booking summary — guest name, room, time slot, "Confirm Check-in" button
- [x] On confirm: `booking.status → checked_in`, timestamp recorded
- [x] Wrong credentials → "Invalid credentials. Please check again."
- [x] Correct booking but wrong date → "This booking is not for today."
- [x] Already checked in → "Already checked in at [time]."
- [x] Booking cancelled → "This booking has been cancelled."
- [x] Session ended → "This session has already ended."
- [x] Check-in allowed from 15 min before `start_time` until 30 min after `end_time`
- [x] Outside window → "Check-in window not open yet." / "Check-in window has closed."

**Out of scope for this spec:**
- QR camera integration (deferred — camera placeholder shown instead)
- Real backend endpoint `POST /partner/bookings/:id/check-in` (deferred — uses localStorage)

---

## Backend

> **Not yet built.** This spec implements the frontend + localStorage layer only.  
> Backend endpoint when ready: `POST /partner/bookings/:id/check-in { qr_code_token }`  
> See `docs/backend-api-spec.md` §10 for the full contract.

---

## Frontend

### New files

| File | Purpose |
|---|---|
| *(none — rewrites existing)* | |

### Modified files

| File | Change |
|---|---|
| `app/[locale]/partner/scanner/page.tsx` | Full rewrite — state machine, validation, localStorage writes |
| `lib/types/index.ts` | Added `accessCode?`, `checkedInAt?` to `Booking`; added `CheckInRecord` interface |
| `lib/data/bookings.ts` | Added `accessCode` to existing confirmed bookings; added 2 today-dated mock bookings |
| `lib/i18n/dictionaries/en.json` | Added ~15 check-in keys under `"partner"` |
| `lib/i18n/dictionaries/vi.json` | Same keys in Vietnamese |

### State machine

```typescript
type ScannerPhase =
  | { phase: "idle" }
  | { phase: "searching" }           // 400ms simulated delay
  | { phase: "found"; booking: Booking }
  | { phase: "error"; message: string }
  | { phase: "success"; booking: Booking; checkedInAt: string }
```

### Validation order (in `handleSearch`)

```
1. Merge mock bookings + dinomad_bookings localStorage (localStorage wins on duplicate ID)
2. Find booking by ID (case-insensitive)
3. Match accessCode (trim + toUpperCase)
4. Check status: checked_in | cancelled | completed | pending → specific errors
5. Check booking.date === today (YYYY-MM-DD)
6. Check time window: startTime - 15min ≤ now ≤ endTime + 30min
7. All pass → phase: "found"
```

### On confirm check-in

```
1. Re-read dinomad_bookings from localStorage (avoid stale overwrite)
2. Upsert booking with status: "checked_in", checkedInAt: ISO timestamp
3. Append CheckInRecord to dinomad_checkins localStorage
4. Update recentScans state (last 5, newest first)
5. Set phase: "success"
```

### localStorage keys written

| Key | Shape | When |
|---|---|---|
| `dinomad_bookings` | `Booking[]` | On confirm check-in |
| `dinomad_checkins` | `CheckInRecord[]` | On confirm check-in |

### i18n keys added

```json
"partner": {
  "accessCode", "enterAccessCode", "bookingIdLabel", "enterBookingIdPlaceholder",
  "searchVerify", "confirmCheckIn", "checkInSuccess", "checkInSuccessDesc",
  "checkInError", "checkInNotFound", "checkInWrongDate", "checkInAlreadyDone",
  "checkInCancelled", "checkInEnded", "checkInPending", "checkInNotYet",
  "checkInWindowClosed", "recentScans", "cameraComingSoon", "scannerTitle", "scannerSubtitle"
}
```

Note: `checkInAlreadyDone` contains `{time}` placeholder — call `.replace("{time}", formattedTime)` in component.

---

## Test Plan

- [x] Enter `BK-20260609-001` + `A3F7` → booking summary for Hoang Nam appears
- [x] Click "Confirm Check-in" → success card; entry in Recent Scans
- [x] Re-enter same booking → "Already checked in at HH:MM"
- [x] Enter unknown ID → "Booking not found"
- [x] Enter correct ID + wrong code → "Booking not found" (same message — no field enumeration)
- [x] Enter a booking with past date → "This booking is not for today"
- [x] `localStorage.getItem("dinomad_checkins")` — new record present after check-in

---

## Notes

- Access code intentionally returns the same error for wrong ID or wrong code — avoids leaking which field is incorrect (security best practice)
- `checkedInAt` stored as ISO string in localStorage; formatted for display using `toLocaleTimeString("vi-VN")`
- When swapping to real backend: replace the `handleSearch` + `handleConfirmCheckIn` logic with a single `POST /partner/bookings/:id/check-in` call; keep the state machine and UI unchanged
- Test credentials: `BK-20260609-001` / `A3F7` and `BK-20260609-002` / `B9K2`
