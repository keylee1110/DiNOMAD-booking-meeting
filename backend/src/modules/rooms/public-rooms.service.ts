import { Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { VenuesService } from "./venues.service"

type RoomRow = {
  id: string
  venue_id: string
  name: string
  description: string
  capacity: number
  price_per_hour: number
  category: string | null
  status: string
  verified: boolean
  noise_level: number | null
  specs: Record<string, string>
  created_at: string
  updated_at: string
  room_amenities?: { amenity: string }[]
  room_vibe_tags?: { vibe_tag: string }[]
  room_images?: { id: string; image_url: string; sort_order: number }[]
  venues?: {
    id: string
    name: string
    address: string
    district: string
    city: string
    lat: number | null
    lng: number | null
    image_url: string | null
    open_time: string | null
    close_time: string | null
  }
}

export interface SearchRoomsQuery {
  query?: string
  district?: string
  minCapacity?: number
  maxPrice?: number
  amenities?: string[]
  vibeTags?: string[]
  category?: string
  verified?: boolean
  noiseLevelMin?: number
  page?: number
  pageSize?: number
}

@Injectable()
export class PublicRoomsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  async search(query: SearchRoomsQuery) {
    const { data, error } = await this.supabase.admin
      .from("rooms")
      .select(
        `*,
        room_amenities(amenity),
        room_vibe_tags(vibe_tag),
        room_images(id, image_url, sort_order),
        venues!inner(id, name, address, district, city, lat, lng, image_url, open_time, close_time)
        `,
      )
      .eq("status", "published")
      .eq("venues.status", "published")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as RoomRow[]

    let filtered = rows

    if (query.district) {
      const q = query.district.toLowerCase()
      filtered = filtered.filter((r) => r.venues?.district.toLowerCase().includes(q))
    }
    if (query.minCapacity) {
      filtered = filtered.filter((r) => r.capacity >= query.minCapacity!)
    }
    if (query.maxPrice) {
      filtered = filtered.filter((r) => r.price_per_hour <= query.maxPrice!)
    }
    if (query.category) {
      filtered = filtered.filter((r) => r.category === query.category)
    }
    if (query.verified) {
      filtered = filtered.filter((r) => r.verified)
    }
    if (query.noiseLevelMin) {
      filtered = filtered.filter((r) => (r.noise_level ?? 0) >= query.noiseLevelMin!)
    }
    if (query.amenities && query.amenities.length > 0) {
      filtered = filtered.filter((r) => {
        const roomAmenities = (r.room_amenities ?? []).map((a) => a.amenity)
        return query.amenities!.every((a) => roomAmenities.includes(a))
      })
    }
    if (query.vibeTags && query.vibeTags.length > 0) {
      filtered = filtered.filter((r) => {
        const roomVibes = (r.room_vibe_tags ?? []).map((v) => v.vibe_tag)
        return query.vibeTags!.some((v) => roomVibes.includes(v))
      })
    }
    if (query.query) {
      const q = query.query.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.venues?.name.toLowerCase().includes(q) ||
          r.venues?.district.toLowerCase().includes(q),
      )
    }

    const total = filtered.length
    const pageSize = query.pageSize || 6
    const page = query.page || 1
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const start = (page - 1) * pageSize
    const paginated = filtered.slice(start, start + pageSize)

    const rooms = paginated.map((r) => this.toPublicRoomResponse(r))

    return { rooms, total, page, pageSize, totalPages }
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.admin
      .from("rooms")
      .select(
        `*,
        room_amenities(amenity),
        room_vibe_tags(vibe_tag),
        room_images(id, image_url, sort_order),
        venues!inner(id, name, address, district, city, lat, lng, image_url, open_time, close_time)
        `,
      )
      .eq("id", id)
      .eq("status", "published")
      .eq("venues.status", "published")
      .single()

    if (error || !data) throw new NotFoundException("Room not found")

    return this.toPublicRoomResponse(data as RoomRow)
  }

  private toPublicRoomResponse(room: RoomRow) {
    const venue = room.venues!
    return {
      id: room.id,
      venueId: room.venue_id,
      venueName: venue.name,
      venueAddress: venue.address,
      district: venue.district,
      city: venue.city,
      lat: venue.lat,
      lng: venue.lng,
      venueImageUrl: venue.image_url,
      openTime: venue.open_time,
      closeTime: venue.close_time,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      pricePerHour: room.price_per_hour,
      category: room.category,
      verified: room.verified,
      noiseLevel: room.noise_level,
      specs: room.specs ?? {},
      amenities: (room.room_amenities ?? []).map((a) => a.amenity),
      vibeTags: (room.room_vibe_tags ?? []).map((v) => v.vibe_tag),
      images: (room.room_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => ({ id: img.id, imageUrl: img.image_url, sortOrder: img.sort_order })),
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    }
  }
}
