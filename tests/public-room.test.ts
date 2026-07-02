import assert from "node:assert/strict"
import test from "node:test"
import { mapPublicRoom } from "../lib/data/public-room"

test("maps a published Supabase room into the customer Room shape", () => {
  const room = mapPublicRoom({
    id: "room-id",
    venue_id: "venue-id",
    name: "Demo Room",
    description: "A room created by a partner",
    capacity: 8,
    price_per_hour: 150000,
    category: "team_hub",
    verified: false,
    noise_level: 7.5,
    specs: { wifiSpeed: "200 Mbps" },
    venues: {
      name: "Demo Venue",
      address: "1 Demo Street",
      district: "District 1",
      lat: 10.77,
      lng: 106.7,
      open_time: "07:00",
      close_time: "22:00",
    },
    room_amenities: [{ amenity: "wifi" }, { amenity: "tv" }],
    room_vibe_tags: [{ vibe_tag: "modern" }],
    room_images: [{ image_url: "https://example.com/room.jpg", sort_order: 0 }],
    reviews: [{ rating: 5 }, { rating: 4 }, { rating: 4 }],
  })

  assert.equal(room.id, "room-id")
  assert.equal(room.venueName, "Demo Venue")
  assert.deepEqual(room.amenities, ["wifi", "tv"])
  assert.deepEqual(room.images, ["https://example.com/room.jpg"])
  assert.equal(room.pricePerHour, 150000)
  assert.equal(room.rating, 4.3)
  assert.equal(room.reviewCount, 3)
  // Time-dependent: remaining open hours today, bounded by the full 07:00–22:00 window
  assert.ok(room.slotsLeftToday >= 0 && room.slotsLeftToday <= 15)
})
