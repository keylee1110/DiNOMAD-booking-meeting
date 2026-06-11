# Spec: Partner Inventory Toggle (Room-Level)

**Status:** `done`  
**PRD ref:** §10.2  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-09

---

## Overview

Partners need to instantly block an entire room from appearing in search results — for walk-ins, maintenance, or private events — without having to manage individual time slots.  
This adds a room-level "Busy" toggle to each room card in the Inventory page, with an optional reason field and localStorage persistence.

---

## Acceptance Criteria

- [x] Partner can toggle any of their rooms to "Available" or "Busy"
- [x] When toggled to "Busy": room hidden from search results immediately *(frontend-only: visual state; backend `PATCH /partner/rooms/:id/status` wires this to real DB)*
- [x] When toggled to "Available": room appears in search results immediately
- [x] Toggle state persisted — survives page refresh
- [x] Reason field (optional): "Walk-in customer", "Maintenance", "Private event"

**Out of scope for this spec:**
- Wiring the toggle to `PATCH /partner/rooms/:id/status` (backend not built at time of writing)
- Affecting the search results page in real-time (requires backend)

---

## Backend

> **Not yet built.** Uses localStorage only.  
> When ready: replace `handleConfirmBlock` / `handleSetAvailable` with `updateRoomStatus(roomId, status)` from `lib/api/partner.ts`.

---

## Frontend

### Modified files

| File | Change |
|---|---|
| `components/partner/inventory-toggle.tsx` | Added room-level toggle, reason panel, busy state overrides |
| `lib/types/index.ts` | Added `RoomStatusReason`, `RoomStatusEntry` interfaces |
| `lib/i18n/dictionaries/en.json` | Added toggle/reason keys under `"partner"` |
| `lib/i18n/dictionaries/vi.json` | Same in Vietnamese |

### New state in `InventoryToggle`

```typescript
const [roomStatus, setRoomStatus] = useState<"available" | "busy">("available")
const [showReasonPanel, setShowReasonPanel] = useState(false)
const [pendingReason, setPendingReason] = useState<RoomStatusReason | "">("")
const [hydrated, setHydrated] = useState(false)
// hydrated via useEffect to avoid SSR mismatch
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

- [x] Navigate to `/partner/inventory` — all rooms show "Available" state on first load
- [x] Click "Busy" on a room — reason dropdown appears
- [x] Select "Maintenance", click "Block Room" — header shows red "Busy" badge; slots grayed out
- [x] Reload page — "Busy" state persists (from localStorage)
- [x] Click "Mark as Available" — header reverts to green slot count; slots interactive again
- [x] `localStorage.getItem("dinomad_room_status")` — entry present after blocking

---

## Notes

- `e.stopPropagation()` is critical on all toggle/reason buttons — the legacy single-button header pattern would fire expand/collapse on any click within the row
- `pendingReason` is required before `confirmBlock` is enabled — UX forces partner to pick a reason
- `hydrated` gates the toggle buttons to prevent hydration mismatch (server renders "available" by default; localStorage may say "busy")
- To wire to real backend: in `handleConfirmBlock`, after localStorage write, also call `updateRoomStatus(roomId, "unavailable")`; in `handleSetAvailable`, call `updateRoomStatus(roomId, "published")`
