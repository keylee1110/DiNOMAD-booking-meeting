# Spec: Partner Earnings Tab

**Status:** `done`  
**PRD ref:** §10.4  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-09

---

## Overview

Partners need visibility into their revenue, commission deductions, and payout history.  
This creates the Earnings page at `/partner/earnings` using mock data, giving partners a full read-only view of their financial performance before the real backend is wired.

---

## Acceptance Criteria

- [x] Shows total earned this month and last month
- [x] Shows per-booking breakdown: date, room, guest, amount earned, platform fee deducted
- [x] Shows payout history: date paid, amount, transfer reference
- [x] Shows "Pending payout" amount (completed bookings not yet settled)

**Out of scope for this spec:**
- Real data from `GET /partner/earnings?startDate=&endDate=` (deferred — backend not built)
- Actual payout triggering

---

## Backend

> **Not yet built.** Uses `earningsData[]` and `bookings[]` from `lib/data/`.  
> When ready: replace static data sources with `GET /partner/earnings?startDate=&endDate=`.

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `app/[locale]/partner/earnings/page.tsx` | New page — stat cards, bar chart, per-booking table, payout history |

### Modified files

| File | Change |
|---|---|
| `app/[locale]/partner/layout.tsx` | Added "Earnings" nav item (`TrendingUp` icon), replaced "Venues" (Venues re-added later) |
| `lib/i18n/dictionaries/en.json` | Added earnings keys under `"partner"` |
| `lib/i18n/dictionaries/vi.json` | Same in Vietnamese |

### Data sources

```typescript
import { earningsData } from "@/lib/data/venues"       // 14-day mock revenue array
import { bookings } from "@/lib/data/bookings"          // 8 mock bookings
```

### Stat cards

| Label | Value | Source |
|---|---|---|
| This Month | Sum of `earningsData[].revenue` | `lib/data/venues.earningsData` |
| Last Month | Hardcoded `18_200_000` | Placeholder |
| Commission (10%) | Sum of `earningsData[].commission` | Derived |
| Pending Payout | Sum of `roomFee - platformFee` for `checked_in\|completed` bookings | `lib/data/bookings` |

### Bar chart

- 14 bars (one per `earningsData` entry)
- Height proportional to `revenue / max(revenue)`
- Last bar highlighted with `bg-primary`; others `bg-primary/15`
- No external chart library — pure CSS `height` style on divs

### Per-booking table

- Source: `bookings` filtered to `confirmed | checked_in | completed`, sorted by date descending
- Columns: Booking ID, Room + Guest, Date, Room Fee, −Commission, Net
- Net = `roomFee − platformFee`
- Striped rows via `i % 2 === 0` conditional class

### Payout history

- 3 hardcoded mock payouts with transfer references
- Each row: date, reference (monospace), amount, "Paid" badge

### i18n keys added

```json
"partner": {
  "earningsTitle", "earningsSubtitle",
  "totalEarningsMonth", "lastMonth", "pendingPayout",
  "perBookingBreakdown", "payoutHistory", "noPayouts"
}
```

---

## Test Plan

- [x] Navigate to `/partner/earnings` — page loads without error
- [x] Stat cards show non-zero values
- [x] Bar chart renders with 14 bars; last bar is primary color
- [x] Per-booking table shows rows for confirmed/checked_in/completed bookings
- [x] Commission column shows negative values (e.g. `−16,000 ₫`)
- [x] Net column shows green bold values
- [x] Payout history shows 3 rows with "Paid" badges

---

## Notes

- Commission is computed as `Math.round(b.roomFee * 0.10)` which equals `b.platformFee` — consistent with the platform fee in all mock data
- Period toggle (Daily/Weekly/Monthly) is wired to UI state but does not yet change the chart data (all three show the same 14-day array) — this is a known limitation for the mock phase
- `formatVND()` from `lib/format.ts` used for all currency display — never raw `Intl.NumberFormat` inline
