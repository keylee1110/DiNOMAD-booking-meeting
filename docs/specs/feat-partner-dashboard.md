# Spec: Partner Dashboard Enhancements

**Status:** `done`  
**PRD ref:** §10.1  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-09

---

## Overview

The partner dashboard previously showed hardcoded/mock metrics with no real data.  
This spec adds three data-driven widgets: computed today's stats, a Pending Check-ins list, and an Upcoming Bookings sidebar card — all derived from merged mock + localStorage data.

---

## Acceptance Criteria

- [x] Shows today's stats: bookings count, revenue, check-ins completed
- [x] Shows this week's vs last week's performance (week-to-date metric retained from original)
- [x] Shows upcoming bookings (next 3) with guest name and time
- [x] Shows pending check-ins (confirmed bookings that haven't checked in yet)

**Out of scope for this spec:**
- Real-time data from `GET /partner/stats` (deferred — backend not built)
- WebSocket live updates

---

## Backend

> **Not yet built.** All data is computed client-side from merged mock + localStorage.

---

## Frontend

### Modified files

| File | Change |
|---|---|
| `app/[locale]/partner/page.tsx` | Added `checkIns` state, computed stats, Pending Check-ins card, Upcoming Bookings card |
| `lib/i18n/dictionaries/en.json` | Added stat/widget keys under `"partner"` |
| `lib/i18n/dictionaries/vi.json` | Same in Vietnamese |

### New state

```typescript
const [localBookings, setLocalBookings] = useState<Booking[]>([])
const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
const [hydrated, setHydrated] = useState(false)

// loaded in useEffect from:
//   dinomad_bookings  → localBookings
//   dinomad_checkins  → checkIns
```

### Computed values (all via `useMemo`)

```typescript
const TODAY = useMemo(() => new Date().toISOString().slice(0, 10), [])

// Merged, deduplicated — localStorage wins on duplicate ID
const allBookings = useMemo(() => {
  const map = new Map([...mockBookings, ...localBookings].map(b => [b.id, b]))
  return Array.from(map.values())
}, [localBookings])

// Set of booking IDs that have been checked in (from both sources)
const checkedInIds = useMemo(() => new Set([
  ...checkIns.map(c => c.bookingId),
  ...allBookings.filter(b => b.status === "checked_in").map(b => b.id),
]), [checkIns, allBookings])

// Pending check-ins: today's confirmed bookings not yet checked in
const pendingCheckIns = useMemo(() =>
  allBookings
    .filter(b => b.date === TODAY && b.status === "confirmed" && !checkedInIds.has(b.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
, [allBookings, TODAY, checkedInIds])

// Upcoming: top 3 of pendingCheckIns
const upcomingToday = useMemo(() => pendingCheckIns.slice(0, 3), [pendingCheckIns])
```

### Metrics grid (index → label → value)

| # | Label | Source |
|---|---|---|
| 0 | Check-ins Today | `checkedInIds.size` |
| 1 | Bookings Today | `allBookings` where `date=TODAY && status∈{confirmed,checked_in}` |
| 2 | Revenue Today | Sum of `totalPrice` for today's confirmed+checked_in |
| 3 | Active Walk-ins | Hardcoded `"3"` (placeholder until backend) |

### i18n keys added

```json
"partner": {
  "checkInsToday", "bookingsToday", "revenueToday", "activeWalkIns",
  "pendingCheckIns", "noPendingCheckIns",
  "upcomingBookings", "noUpcomingBookings",
  "verifyNow"
}
```

---

## Test Plan

- [x] Navigate to `/partner` — stats show `0` before any check-in action
- [x] Complete a check-in via `/partner/scanner` — return to dashboard — check-ins count increments
- [x] Pending Check-ins card lists `BK-20260609-002` (Bui Lan — not yet checked in)
- [x] "Verify Now" → navigates to scanner
- [x] Upcoming Bookings shows same bookings with start/end time
- [x] After checking in `BK-20260609-002` — it disappears from both widgets

---

## Notes

- `hydrated` flag gates the stat display to avoid SSR mismatch (values computed only client-side)
- Activity feed now prepends real check-in events from `checkIns` localStorage ahead of the hardcoded base feed
- When swapping to backend: replace the `useEffect` data load with `GET /partner/stats` + `GET /partner/bookings?status=confirmed&date=today`; the computed useMemos become redundant and can be removed
