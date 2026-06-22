# Spec: Search Page Enhancements — Missing Filters & Pagination

**Status:** `done`  
**PRD ref:** §4  
**Branch:** `NhiNBU`  
**Author:** —  
**Date:** 2026-06-15

---

## Overview

The search page has basic filters (district, price, capacity, amenities) but is missing vibe tag filter UI, category filter, noise level filter, verified-only toggle, date/availability filter, the "water" amenity, and pagination. This spec adds all of them to bring the search page to feature parity with the data model.

---

## Acceptance Criteria

- [x] AC 1: Vibe tag filter UI added as checkboxes below amenities in the filter panel
- [x] AC 2: "water" amenity added to the amenity checkboxes list
- [x] AC 3: Category filter (team_hub / solo_nook) added as a toggle/select
- [x] AC 4: Verified-only toggle (switch) added
- [x] AC 5: Noise level minimum slider added
- [x] AC 6: Date picker added using existing Calendar + Popover components
- [x] AC 7: Pagination added — 6 rooms per page with page controls
- [x] AC 8: `searchRooms()` updated with new filter params and pagination support
- [x] AC 9: Active filter badges show for all new filters
- [x] AC 10: i18n keys added for all new filter labels
- [x] AC 11: Backend public `GET /api/rooms` and `GET /api/rooms/:id` endpoints created with search + pagination
- [x] AC 12: `lib/api.ts` shared apiFetch helper created
- [x] AC 13: `lib/api/rooms.ts` API client with demo fallback to mock data
- [x] AC 14: Search page uses async API with loading spinner
- [x] AC 15: Room detail page uses async API with loading spinner
- [x] AC 16: Leaflet map shows real room locations from API data

---

## Backend

### New endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms` | Public | Search published rooms with filters + pagination |
| `GET` | `/api/rooms/:id` | Public | Get published room detail with venue info |

### Query params for `GET /api/rooms`

| Param | Type | Description |
|---|---|---|
| `query` | `string` | Text search on name, description, venue name, district |
| `district` | `string` | Filter by district (case-insensitive partial) |
| `minCapacity` | `number` | Minimum capacity |
| `maxPrice` | `number` | Maximum price per hour |
| `amenities` | `string` | Comma-separated AND filter |
| `vibeTags` | `string` | Comma-separated OR filter |
| `category` | `string` | `team_hub` or `solo_nook` |
| `verified` | `boolean` | Only verified rooms |
| `noiseLevelMin` | `number` | Minimum noise level |
| `page` | `number` | Page number (1-indexed, default 1) |
| `pageSize` | `number` | Items per page (default 6) |

### New files

| File | Purpose |
|---|---|
| `backend/src/modules/rooms/public-rooms.controller.ts` | Public room search/detail controller |
| `backend/src/modules/rooms/public-rooms.service.ts` | Room search/detail service with Supabase queries |

### Modified files

| File | Change |
|---|---|
| `backend/src/modules/rooms/rooms.module.ts` | Register `PublicRoomsController` + `PublicRoomsService` |

### Response shape

```typescript
{
  rooms: {
    id: string
    venueId: string
    venueName: string
    venueAddress: string
    district: string
    city: string
    lat: number | null
    lng: number | null
    venueImageUrl: string | null
    openTime: string
    closeTime: string
    name: string
    description: string
    capacity: number
    pricePerHour: number
    category: string | null
    verified: boolean
    noiseLevel: number | null
    specs: Record<string, string>
    amenities: string[]
    vibeTags: string[]
    images: { id: string; imageUrl: string; sortOrder: number }[]
    createdAt: string
    updatedAt: string
  }[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

## Frontend

### New files

| File | Purpose |
|---|---|
| `lib/api.ts` | Shared `apiFetch` helper wrapping fetch with `NEXT_PUBLIC_BACKEND_URL` |
| `lib/api/rooms.ts` | `searchRoomsApi()` and `getRoomByIdApi()` with demo fallback |

### Modified files

| File | Change |
|---|---|
| `lib/data/rooms.ts` | Add `category`, `verified`, `noiseLevelMin`, `date`, `page`, `pageSize` to `searchRooms()` filters; return `{ rooms, total, page, pageSize, totalPages }` |
| `app/[locale]/(main)/search/page.tsx` | Replace `searchRooms` with `searchRoomsApi` async call, add loading state; add Leaflet map view |
| `app/[locale]/(main)/rooms/[id]/page.tsx` | Replace `getRoomById` with `getRoomByIdApi` async call with loading state; import `Room` type |

### New filter params for `searchRooms()`

```typescript
filters: {
  // existing...
  category?: "team_hub" | "solo_nook"
  verified?: boolean
  noiseLevelMin?: number
  date?: string        // reserved for future availability check
  page?: number        // 1-indexed
  pageSize?: number    // default 6
}
```

### Return type

```typescript
{ rooms: Room[], total: number, page: number, pageSize: number, totalPages: number }
```

### i18n keys added

```json
// en.json
"search": {
  "vibeTags": "Vibe & Atmosphere",
  "category": "Room Type",
  "categoryAll": "All Types",
  "teamHub": "Team Hub",
  "soloNook": "Solo Nook",
  "verifiedOnly": "Verified Only",
  "noiseLevel": "Min Quiet Level",
  "anyNoise": "Any",
  "quiet": "Quiet",
  "moderate": "Moderate",
  "veryQuiet": "Very Quiet",
  "date": "Availability Date",
  "anyDate": "Any Date",
  "pagination": "Page {current} of {total}",
  "prev": "Previous",
  "next": "Next"
}

// vi.json — same structure, Vietnamese values
```

---

## Test Plan

- [x] Manual: navigate to `/en/search`, verify all new filters render in sidebar and mobile drawer
- [x] Manual: toggle vibe tag checkboxes, verify results filtered correctly
- [x] Manual: select category, verify only matching rooms shown
- [x] Manual: toggle verified-only, verify unverified room excluded
- [x] Manual: adjust noise level slider, verify rooms below threshold excluded
- [x] Manual: select a date, verify no crash (backend availability check not implemented yet)
- [x] Manual: pagination shows correct page count, click through pages
- [x] Manual: clear filters resets all new filters
- [x] Manual: active filter badges display and dismiss correctly for new filters
