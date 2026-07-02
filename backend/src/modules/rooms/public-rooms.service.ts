import { Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { VenuesService } from "./venues.service"

type RoomRow = {
  id: string
  venue_id: string
  name: string
  name_vi: string | null
  description: string
  description_vi: string | null
  capacity: number
  price_per_hour: number
  category: string | null
  status: string
  verified: boolean
  noise_level: number | null
  specs: Record<string, string>
  specs_vi: Record<string, string>
  created_at: string
  updated_at: string
  room_amenities?: { amenity: string }[]
  room_vibe_tags?: { vibe_tag: string }[]
  room_images?: { image_url: string; sort_order: number }[]
  venues?: {
    id: string
    name: string
    name_vi: string | null
    address: string
    address_vi: string | null
    district: string
    city: string
    lat: number | null
    lng: number | null
    image_url: string | null
    open_time: string | null
    close_time: string | null
  }
}

type RoomAggregation = {
  room_id: string
  avg_rating: number | null
  review_count: number
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
        room_images(image_url, sort_order),
        venues!inner(id, name, name_vi, address, address_vi, district, city, lat, lng, image_url, open_time, close_time)
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

    const roomIds = paginated.map((r) => r.id)
    const aggregations = roomIds.length > 0 ? await this.fetchRoomAggregations(roomIds) : []
    const aggMap = new Map(aggregations.map((a) => [a.room_id, a]))

    const rooms = paginated.map((r) => this.toPublicRoomResponse(r, aggMap.get(r.id)))

    return { rooms, total, page, pageSize, totalPages }
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.admin
      .from("rooms")
      .select(
        `*,
        room_amenities(amenity),
        room_vibe_tags(vibe_tag),
        room_images(image_url, sort_order),
        venues!inner(id, name, name_vi, address, address_vi, district, city, lat, lng, image_url, open_time, close_time)
        `,
      )
      .eq("id", id)
      .eq("status", "published")
      .eq("venues.status", "published")
      .single()

    if (error || !data) throw new NotFoundException("Room not found")

    const room = data as RoomRow
    const aggregations = await this.fetchRoomAggregations([id])
    const agg = aggregations[0]

    return this.toPublicRoomResponse(room, agg)
  }

  private async fetchRoomAggregations(roomIds: string[]): Promise<RoomAggregation[]> {
    if (roomIds.length === 0) return []

    const { data, error } = await this.supabase.admin
      .from("reviews")
      .select("room_id, rating")
      .in("room_id", roomIds)

    if (error) throw new Error(error.message)

    const grouped = new Map<string, number[]>()
    for (const row of data ?? []) {
      const list = grouped.get(row.room_id) ?? []
      list.push(row.rating)
      grouped.set(row.room_id, list)
    }

    return roomIds.map((roomId) => {
      const ratings = grouped.get(roomId) ?? []
      const sum = ratings.reduce((s, r) => s + r, 0)
      return {
        room_id: roomId,
        avg_rating: ratings.length > 0 ? Math.round((sum / ratings.length) * 10) / 10 : null,
        review_count: ratings.length,
      }
    })
  }

  private toPublicRoomResponse(
    room: RoomRow,
    agg?: RoomAggregation,
  ) {
    const venue = room.venues!
    const images = (room.room_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.image_url)
    const capacity = room.capacity
    return {
      id: room.id,
      venueId: room.venue_id,
      venueName: venue.name,
      venueNameVi: venue.name_vi ?? undefined,
      name: room.name,
      nameVi: room.name_vi ?? undefined,
      description: room.description,
      descriptionVi: room.description_vi ?? undefined,
      district: venue.district,
      address: venue.address,
      addressVi: venue.address_vi ?? undefined,
      capacity,
      pricePerHour: room.price_per_hour,
      amenities: (room.room_amenities ?? []).map((a) => a.amenity),
      vibeTags: (room.room_vibe_tags ?? []).map((v) => v.vibe_tag),
      images,
      rating: agg?.avg_rating ?? 0,
      reviewCount: agg?.review_count ?? 0,
      verified: room.verified,
      noiseLevel: room.noise_level ?? undefined,
      specs: (room.specs ?? {}) as Record<string, string>,
      specsVi: (room.specs_vi ?? {}) as Record<string, string>,
      category: room.category ?? undefined,
      lat: venue.lat ?? 0,
      lng: venue.lng ?? 0,
      slotsLeftToday: this.computeSlotsLeft(venue.open_time, venue.close_time),
    }
  }

  // Slots are 1-hour blocks, so slots left today = remaining open hours
  // counted from the current hour in Vietnam time (UTC+7)
  private computeSlotsLeft(openTime: string | null, closeTime: string | null): number {
    if (!openTime || !closeTime) return 10
    const openHour = parseInt(openTime.split(":")[0], 10)
    const closeHour = parseInt(closeTime.split(":")[0], 10)
    const now = new Date()
    const vnHour = (now.getUTCHours() + 7) % 24
    return Math.max(0, closeHour - Math.max(openHour, vnHour))
  }
}
