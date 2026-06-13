# Spec: Partner Inventory Toggle (Room-Level)

**Status:** `done`  
**PRD ref:** §10.2  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-13

---

## Overview

Partners need to instantly block an entire room from appearing in search results — for walk-ins, maintenance, or private events — without having to manage individual time slots.  
This adds a room-level "Busy" toggle to each room card in the Inventory page, with an optional reason field and localStorage persistence.

---

## Acceptance Criteria

- [x] Partner can toggle any of their rooms to "Available" or "Busy"
- [x] When toggled to "Busy": calls `PATCH /partner/rooms/:id/status` with `status: "unavailable"` — persisted to DB
- [x] When toggled to "Available": calls `PATCH /partner/rooms/:id/status` with `status: "published"` — persisted to DB
- [x] Toggle state persisted — survives page refresh (DB is source of truth; localStorage mirrors for fast hydration)
- [x] Reason field (optional): "Walk-in customer", "Maintenance", "Private event"
- [x] Inventory page loads real rooms from `GET /partner/venues` instead of hardcoded list
- [x] Archived rooms excluded from inventory list
- [x] Loading spinner shown during API toggle call; buttons disabled while in-flight
- [x] Toast on success and error
- [x] Optimistic UI — status updates immediately on click; reverts on API error
- [x] `hydrated` initialises to `true` when `initialDbStatus` prop is provided (no button flash on mount)
- [x] Date navigation — prev/next arrows + "Pick" calendar input in expanded slot grid
- [x] Slots reload when selected date changes (range: 7 days back → 30 days forward)
- [x] Slot grid shows loading spinner while fetching, "No slots" message when empty

**Out of scope for this spec:**
- Affecting the guest search results page in real-time (requires backend pub/sub or polling)

---

## Backend

Uses existing endpoint from `feat-partner-room-venue-crud`:

| Method | Path | Auth | Payload | Description |
|---|---|---|---|---|
| `PATCH` | `/partner/rooms/:roomId/status` | `supplier` | `{ status: "published" \| "unavailable" \| "archived" }` | Toggle room availability |

Status mapping:

| UI state | DB status |
|---|---|
| Available | `published` |
| Busy | `unavailable` |

---

## Frontend

### Modified files

| File | Change |
|---|---|
| `app/[locale]/partner/inventory/page.tsx` | Loads real rooms from `getPartnerVenues()`, passes `id`, `name`, `status` to each toggle |
| `components/partner/inventory-toggle.tsx` | Wired to `updateRoomStatus()` API; added `initialDbStatus` prop, `toggling` state, loading spinner |
| `lib/types/index.ts` | `RoomStatusReason`, `RoomStatusEntry` interfaces |
| `lib/i18n/dictionaries/en.json` | Toggle/reason keys under `"partner"` |
| `lib/i18n/dictionaries/vi.json` | Same in Vietnamese |

### `InventoryToggle` props

```typescript
interface InventoryToggleProps {
  roomId?: string
  roomName?: string
  initialDbStatus?: string  // "published" | "unavailable" | "draft" — from API
  className?: string
}
```

`initialDbStatus` maps to UI: `"unavailable"` → `"busy"`, anything else → `"available"`.

### New state in `InventoryToggle`

```typescript
const [roomStatus, setRoomStatus] = useState<"available" | "busy">(dbStatusToUi(initialDbStatus))
const [showReasonPanel, setShowReasonPanel] = useState(false)
const [pendingReason, setPendingReason] = useState<RoomStatusReason | "">("")
const [hydrated, setHydrated] = useState(initialDbStatus !== undefined)  // skip flash when prop provided
const [toggling, setToggling] = useState(false)  // true while API call in-flight
const [selectedDate, setSelectedDate] = useState(isoToday())   // drives slot grid date
const [slotsLoading, setSlotsLoading] = useState(false)
```

### localStorage key

```
dinomad_room_status  →  { [roomId: string]: RoomStatusEntry }

RoomStatusEntry = {
  status: "available" | "busy"
  reason?: "walk_in" | "maintenance" | "private_event"
  timestamp: string   // ISO
}
```

### Busy-state overrides

When `roomStatus === "busy"`:
- Slot count badge shows red "Busy" label instead of slot count
- Slot grid: all slots rendered as unavailable (visual only — `slot.available` overridden to `false`)
- All slot buttons disabled (`disabled` attr + `cursor-not-allowed opacity-60`)
- Bulk action bar ("Set Avail" / "Set Busy") hidden entirely
- Expand content shows a "Room is blocked" message with an "Unblock" prompt

### Header refactor

The original header was a single `<button>` wrapping the entire row (expand/collapse).  
After the change: header is a `<div>`. Expand/collapse moves to the chevron `<button>` only.  
All toggle buttons call `e.stopPropagation()` to prevent accidental expand/collapse.

### i18n keys added

```json
"partner": {
  "roomStatusBusy", "roomStatusAvailable",
  "roomBlockReason", "reasonWalkIn", "reasonMaintenance", "reasonPrivateEvent",
  "confirmBlock", "unblockRoom"
}
```

---

## Test Plan

- [x] Navigate to `/partner/inventory` — real rooms loaded from API, correct initial status from DB
- [x] Click "Busy" on a room — reason dropdown appears
- [x] Select "Maintenance", click "Block Room" — spinner shows, API called, header shows red "Busy" badge; slots grayed out
- [x] Reload page — "Busy" state persists (room.status = "unavailable" in DB)
- [x] Click "Unblock Room" — spinner shows, API called, header reverts to green slot count; slots interactive
- [x] `localStorage.getItem("dinomad_room_status")` — entry mirrors DB status after toggle
- [x] No rooms → empty state with link to Venues page
- [x] Archived rooms not shown in inventory list

---

## Notes

- `e.stopPropagation()` is critical on all toggle/reason buttons — the legacy single-button header pattern would fire expand/collapse on any click within the row
- `pendingReason` is required before `confirmBlock` is enabled — UX forces partner to pick a reason
- `hydrated` gates the toggle buttons to prevent hydration mismatch (server renders "available" by default; DB/localStorage may say "busy")
- DB status is the source of truth: when `initialDbStatus` prop is provided, localStorage is only a mirror for fast hydration. When prop is absent (legacy static usage), localStorage is the fallback.
- `toggling` disables both the toggle button and the "Block Room" confirm button while the API call is in-flight to prevent double-submit
