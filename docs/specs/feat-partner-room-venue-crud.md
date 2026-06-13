# Spec: Partner Room & Venue CRUD

**Status:** `done`  
**PRD ref:** §10.5  
**Branch:** `feat/ViNTD`  
**Author:** Claude (AI)  
**Date:** 2026-06-13

---

## Overview

Partners need to create and manage their rooms in the database before any guest can search or book them.  
This is the first full-stack feature in the partner portal — both the NestJS backend module and the frontend venues page are wired to the real Supabase database.  
No dependency on the user booking flow.

---

## Acceptance Criteria

- [x] Partner can create a venue (name, address, district)
- [x] Partner can add a room to a venue (name, category, price, capacity, description, amenities, vibe tags, specs)
- [x] Partner can add a room to an existing venue (without creating a duplicate venue)
- [x] Partner can edit any of their rooms
- [x] Partner can archive a room (soft-delete — sets `status = "archived"`, hidden from search)
- [x] Partner can only manage rooms that belong to their own supplier account
- [x] All changes persist to the real Supabase database
- [x] Form validates all required fields with inline error messages before submitting
- [x] Venues with no rooms show a placeholder card with "Add First Room" CTA
- [x] Partner can publish a room (`status: "draft" → "published"`) — triggers slot generation for next 30 days
- [x] Partner can publish a venue (`status: "draft" → "published"`) — marks venue as live
- [x] Room status badge shown on every card (draft=yellow, published=green, unavailable=red)
- [x] "Publish Room" button visible only on `draft` or `unavailable` rooms

**Added in follow-up (2026-06-14):**
- [x] Room image upload — Supabase Storage bucket `room-images`; partners upload JPG/PNG/WebP (≤5 MB, ≤5 per room); uploaded on save; existing images can be removed
- [x] Venue selector — when adding a new room with existing venues, a dropdown pre-selects the first venue (no re-entry of name/address); "Create new venue" option visible in the dropdown

**Out of scope for this spec:**
- Separate venue edit form (venue fields edited inline via the room form)
- Multi-venue management UI (all venues shown as a flat room list)

---

## Backend

### Module: `backend/src/modules/rooms/`

```
rooms.module.ts
venues.controller.ts      @Controller("partner/venues")
venues.service.ts
rooms.controller.ts       @Controller("partner/rooms")
rooms.service.ts
dto/create-venue.dto.ts
dto/update-venue.dto.ts
dto/create-room.dto.ts
dto/update-room.dto.ts
dto/update-room-status.dto.ts
```

Registered in `backend/src/app.module.ts`.

### Endpoints

All require `JwtAuthGuard + RolesGuard(@Roles("supplier", "admin"))`.

| Method | Path | Handler | Description |
|---|---|---|---|
| `GET` | `/partner/venues` | `VenuesController.findMine` | List supplier's venues with nested rooms, amenities, vibe tags |
| `POST` | `/partner/venues` | `VenuesController.create` | Create venue (auto-looks up `supplier_id`) |
| `PATCH` | `/partner/venues/:venueId/status` | `VenuesController.updateStatus` | Publish / unpublish a venue |
| `PATCH` | `/partner/venues/:venueId` | `VenuesController.update` | Update venue fields |
| `GET` | `/partner/venues/:venueId/rooms` | `VenuesController.findRooms` | List rooms for a venue |
| `POST` | `/partner/venues/:venueId/rooms` | `VenuesController.createRoom` | Create room + insert junction rows |
| `PATCH` | `/partner/rooms/:roomId` | `RoomsController.update` | Update room + replace amenities + vibe tags |
| `PATCH` | `/partner/rooms/:roomId/status` | `RoomsController.updateStatus` | Set `published` / `unavailable` / `archived`; publishing triggers slot generation |
| `GET` | `/partner/rooms/:roomId/slots` | `RoomsController.getSlots` | Fetch availability slots for a date (`?date=YYYY-MM-DD`) |
| `DELETE` | `/partner/rooms/:roomId` | `RoomsController.remove` | Soft-delete: `status = "archived"` |

### DTOs

**`CreateVenueDto`**
```typescript
name: string               @IsString @MaxLength(120)
description?: string       @IsOptional @IsString
address: string            @IsString
district: string           @IsString
city?: string              @IsOptional @IsString @MaxLength(80)
phone?: string             @IsOptional @IsString @MaxLength(30)
lat?: number               @IsOptional @IsNumber
lng?: number               @IsOptional @IsNumber
```

**`UpdateVenueDto`** — all fields optional version of `CreateVenueDto`

**`CreateRoomDto`**
```typescript
name: string               @IsString @MaxLength(120)
description?: string       @IsOptional @IsString
capacity: number           @IsInt @Min(1)
pricePerHour: number       @IsInt @Min(10000)
category: string           @IsIn(["team_hub", "solo_nook"])
amenities?: string[]       @IsOptional @IsArray @IsIn(AMENITY_VALUES, each: true)
vibeTags?: string[]        @IsOptional @IsArray @IsIn(VIBE_TAG_VALUES, each: true)
specs?: object             @IsOptional @IsObject
noiseLevel?: number        @IsOptional @IsNumber @Min(0)
```

**`UpdateRoomDto`** — all fields optional version of `CreateRoomDto`

**`UpdateRoomStatusDto`**
```typescript
status: string             @IsIn(["published", "unavailable", "archived"])
```

**`UpdateVenueStatusDto`**
```typescript
status: string             @IsIn(["published", "draft", "suspended"])
```

> **Note:** All `_vi` (Vietnamese i18n) fields were removed from all DTOs and services — those columns do not exist in the database schema. `description` is optional in all DTOs.

### DB changes

No new tables or migrations. Uses existing tables from `supabase/migrations/20260531000000_initial_user_supplier_schema.sql`:
- `venues` — `supplier_id` FK links to `suppliers`
- `rooms` — `venue_id` FK
- `room_amenities (room_id, amenity)` — junction table
- `room_vibe_tags (room_id, vibe_tag)` — junction table

### Service logic

**Ownership helpers (private — called before every write):**
```
getSupplierIdForUser(userId):
  SELECT supplier_id FROM supplier_members
  WHERE user_id = userId AND is_active = true
  → throws ForbiddenException if no active membership

verifyVenueOwnership(venueId, userId):
  SELECT id, supplier_id FROM venues WHERE id = venueId
  → throws NotFoundException if missing
  → calls getSupplierIdForUser, compares supplier_ids
  → throws ForbiddenException if mismatch
```

**Create room (3-step sequential write — no Supabase transaction):**
```
1. INSERT INTO rooms (...) RETURNING *
2. if amenities.length: INSERT INTO room_amenities (room_id, amenity) VALUES (...)
3. if vibeTags.length:  INSERT INTO room_vibe_tags (room_id, vibe_tag) VALUES (...)
```

**Update room (replace strategy for junction tables):**
```
1. UPDATE rooms SET (...) WHERE id = roomId
2. DELETE FROM room_amenities WHERE room_id = roomId
3. if amenities: INSERT INTO room_amenities (...)
4. DELETE FROM room_vibe_tags WHERE room_id = roomId
5. if vibeTags: INSERT INTO room_vibe_tags (...)
```

**List venues with rooms (single relational query — no N+1):**
```typescript
supabase.admin.from("venues")
  .select(`*,
    rooms(id, name, description, capacity, price_per_hour,
          category, status, verified, noise_level, specs, created_at, updated_at,
          room_amenities(amenity), room_vibe_tags(vibe_tag))`)
  .eq("supplier_id", supplierId)
  .neq("status", "suspended")
```

### Response shapes

```typescript
// VenueResponse
{ id, supplierId, name, description, address, district, city,
  lat, lng, phone, imageUrl, status, openTime, closeTime, createdAt, updatedAt, rooms: RoomResponse[] }

// RoomResponse
{ id, venueId, name, description, capacity, pricePerHour,
  category, status, verified, noiseLevel, specs,
  amenities: Amenity[], vibeTags: VibeTag[], createdAt, updatedAt }
```

### Error cases

| Condition | HTTP | Code |
|---|---|---|
| No active supplier membership | 403 | `FORBIDDEN` |
| Venue not found | 404 | `NOT_FOUND` |
| Venue belongs to different supplier | 403 | `FORBIDDEN` |
| Room not found | 404 | `NOT_FOUND` |
| Invalid amenity enum value | 400 | `VALIDATION_ERROR` |

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `lib/api/partner.ts` | Typed fetch client — reads Supabase session token, attaches Bearer header |

### Modified files

| File | Change |
|---|---|
| `app/[locale]/partner/venues/page.tsx` | Full rewrite — loads from API, save creates/updates, delete archives, form validation |
| `app/[locale]/partner/layout.tsx` | Restored Venues nav item (`Building2` icon) |
| `backend/src/app.module.ts` | Added `RoomsModule` import + registration |
| `.env.local` | Added `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api` |

### API client (`lib/api/partner.ts`)

```typescript
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

// Reads supabase session token on every call (no caching — token may refresh)
async function apiFetch<T>(path, options?): Promise<T>
// → attaches Authorization: Bearer <access_token>
// → returns json.data (backend ResponseInterceptor wraps all in { success, data })
// → throws Error with readable message on non-2xx
//   (handles NestJS class-validator errors where message is string[])

// Exported functions:
getPartnerVenues()                              → ApiVenue[]
createVenue(dto: CreateVenuePayload)            → ApiVenue
updateVenue(venueId, dto: UpdateVenuePayload)   → ApiVenue
updateVenueStatus(venueId, status)              → ApiVenue
createRoom(venueId, dto: CreateRoomPayload)     → ApiRoom
updateRoom(roomId, dto: UpdateRoomPayload)      → ApiRoom
updateRoomStatus(roomId, status)                → ApiRoom
getRoomSlots(roomId, date)                      → ApiSlot[]
deleteRoom(roomId)                              → void
```

`ApiVenue` and `ApiRoom` are exported types from `lib/api/partner.ts` (not in `lib/types/index.ts` — they are API response shapes, not core domain types).

### Room form shape

```typescript
interface RoomFormData {
  id: string | null        // null = new room
  venueId: string | null   // null = new venue needed; set = add room to existing venue
  name: string             // → rooms.name
  venueName: string        // → venues.name
  address: string          // → venues.address
  district: string         // → venues.district
  description: string      // → rooms.description
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  specs: { size: string; floor: string; view: string }
  amenities: Amenity[]
  vibeTags: VibeTag[]
  status?: string          // "empty" = venue placeholder with no rooms
}

interface FormErrors {
  name?: string
  venueName?: string
  address?: string
  capacity?: string
  pricePerHour?: string
  description?: string
}
```

### Form validation rules

| Field | Rule |
|---|---|
| Room name | Required, 3–50 chars |
| Venue name | Required, 3–100 chars |
| Address | Required, min 5 chars |
| Capacity | 1–100, whole number |
| Price/hr | 10,000–50,000,000 VND |
| Description | Optional, max 500 chars |

Errors shown inline below each field with red border on the input.

### Save flow

```
Create (id === null, venueId === null):
  1. createVenue({ name: venueName, address, district })
  2. createRoom(venue.id, { name, description, capacity, pricePerHour, category, amenities, vibeTags, specs })
  3. Optimistic: prepend new row to rooms state

Create (id === null, venueId !== null):  ← "Add First Room" to existing venue
  1. createRoom(venueId, { name, description, capacity, pricePerHour, category, amenities, vibeTags, specs })
  2. Optimistic: replace empty placeholder card with new room row

Update (id !== null):
  1. updateVenue(venueId, { name: venueName, address, district })
  2. updateRoom(id, { name, description, capacity, pricePerHour, category, amenities, vibeTags, specs })
  3. Optimistic: replace row in rooms state

Delete:
  1. deleteRoom(id)   // sets status = "archived" on backend
  2. Optimistic: remove row from rooms state

Publish room (status === "draft" or "unavailable"):
  1. updateRoomStatus(id, "published")
  2. Backend calls generate_slots_for_room() RPC → 30 days of slots created
  3. Optimistic: update room.status to "published" in rooms state
  4. "Publish Room" button disappears; green "published" badge shown

Publish venue (venueMap[id].status !== "published"):
  1. updateVenueStatus(venueId, "published")
  2. Optimistic: update venueMap entry status
```

### List view behaviour

- Venues with rooms → normal room card (name, venue, district, capacity, price, status badge)
- Venues with no rooms → dashed placeholder card showing venue name + "Add First Room" button (pre-fills venue fields in form)
- Empty state (no venues at all) → centered empty state with "Add Room" CTA

### Amenity & vibe tag UX

- Amenities: full-width clickable button tiles (not native checkboxes) with custom checkbox indicator and selection counter
- Vibe tags: pill-style toggle buttons with selection counter
- Both use `toggleArrayItem` functional updater to avoid stale closure issues

---

## Test Plan

- [x] Navigate to `/partner/venues` when no rooms exist → empty state with "Add Room" CTA
- [x] Click "Add Room" → form opens blank
- [x] Fill all required fields, click "Save" → Supabase `venues` table has new row; `rooms` table has new row
- [x] Room appears in card list with correct name, district, price, capacity
- [x] Click "Edit" → form pre-filled; change price → save → Supabase row updated
- [x] Click delete (trash icon) → confirm dialog → room disappears from list; Supabase `rooms.status = "archived"`
- [x] Check `room_amenities` table → correct junction rows for selected amenities
- [x] Check `room_vibe_tags` table → correct junction rows for selected vibe tags
- [x] Attempting to edit a room belonging to another supplier → 403 response
- [x] Venue with no rooms shows dashed placeholder card
- [x] "Add First Room" pre-fills venue fields and creates room without duplicate venue
- [x] Form validation blocks save with inline errors when required fields are missing or out of range
- [x] Draft room shows yellow "draft" badge + green "Publish Room" button
- [x] Clicking "Publish Room" calls API, optimistically sets badge to green "published", button disappears
- [x] Published room no longer shows "Publish Room" button
- [x] After publishing, inventory toggle shows real slots generated by `generate_slots_for_room()`

---

## Notes

- **`_vi` columns removed** — `name_vi`, `description_vi`, `address_vi`, `specs_vi` were present in the service/DTOs but never existed in the DB schema. All removed from DTOs, services, and frontend types.
- **`description` is optional** — made optional in both DTO and DB insert (`?? ""`). Frontend validation does not require it.
- **Venue creation on first room** — when `formData.venueId` is already set (adding to existing venue), the service skips `POST /partner/venues` and calls `POST /partner/venues/:id/rooms` directly. The TypeScript type must be `string` (not `string | null`) at the call site to avoid a compilation error that silently blocks the save handler.
- **NestJS validation error parsing** — `apiFetch` handles `message: string[]` from class-validator by joining the array into a readable string before throwing.
- **No Supabase transactions** — the 3-step room creation (rooms → amenities → vibe tags) is not atomic. If step 2 or 3 fails, the room row exists without amenities. Acceptable for MVP.
- `NEXT_PUBLIC_BACKEND_URL` is set to `http://localhost:4000/api` in `.env.local`. Update to the deployed URL before production.
- Photo upload shows a "Coming soon" placeholder — Supabase Storage integration is a separate spec.
