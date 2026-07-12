import type { Amenity, Room, VibeTag } from "@/lib/types"

export interface PublicRoomRow {
  id: string
  venue_id: string
  name: string
  name_vi?: string | null
  description: string
  description_vi?: string | null
  capacity: number
  price_per_hour: number
  category: "team_hub" | "solo_nook" | null
  verified: boolean
  noise_level: number | null
  specs: Room["specs"] | null
  specs_vi?: Room["specs"] | null
  venues: {
    name: string
    name_vi?: string | null
    address: string
    address_vi?: string | null
    district: string
    lat: number | null
    lng: number | null
  }
  room_amenities: { amenity: string }[]
  room_vibe_tags: { vibe_tag: string }[]
  room_images: { image_url: string; sort_order: number }[]
}

export function mapPublicRoom(row: PublicRoomRow): Room {
  const images = [...(row.room_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(image => image.image_url)

  return {
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venues.name,
    venueNameVi: row.venues.name_vi ?? undefined,
    name: row.name,
    nameVi: row.name_vi ?? undefined,
    description: row.description,
    descriptionVi: row.description_vi ?? undefined,
    district: row.venues.district,
    address: row.venues.address,
    addressVi: row.venues.address_vi ?? undefined,
    capacity: row.capacity,
    pricePerHour: row.price_per_hour,
    amenities: (row.room_amenities ?? []).map(item => item.amenity as Amenity),
    vibeTags: (row.room_vibe_tags ?? []).map(item => item.vibe_tag as VibeTag),
    images: images.length > 0 ? images : ["/placeholder.jpg"],
    rating: 0,
    reviewCount: 0,
    verified: row.verified,
    slotsLeftToday: 0,
    noiseLevel: row.noise_level ?? undefined,
    lat: row.venues.lat ?? 10.7769,
    lng: row.venues.lng ?? 106.7009,
    specs: row.specs ?? {},
    specsVi: row.specs_vi ?? undefined,
    category: row.category ?? undefined,
  }
}
