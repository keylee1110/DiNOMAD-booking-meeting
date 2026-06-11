import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreateVenueDto } from "./dto/create-venue.dto"
import { UpdateVenueDto } from "./dto/update-venue.dto"
import { CreateRoomDto } from "./dto/create-room.dto"

type VenueRow = {
  id: string
  supplier_id: string
  name: string
  name_vi: string | null
  description: string | null
  description_vi: string | null
  address: string
  address_vi: string | null
  district: string
  city: string
  lat: number | null
  lng: number | null
  phone: string | null
  image_url: string | null
  status: string
  created_at: string
  updated_at: string
}

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
}

@Injectable()
export class VenuesService {
  constructor(private readonly supabase: SupabaseService) {}

  // ─── Ownership helpers ────────────────────────────────────────────────────

  async getSupplierIdForUser(userId: string): Promise<string> {
    const { data, error } = await this.supabase.admin
      .from("supplier_members")
      .select("supplier_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single()

    if (error || !data) {
      throw new ForbiddenException("You do not have a supplier account")
    }

    return data.supplier_id as string
  }

  async verifyVenueOwnership(venueId: string, userId: string): Promise<VenueRow> {
    const { data: venue, error } = await this.supabase.admin
      .from("venues")
      .select("*")
      .eq("id", venueId)
      .single<VenueRow>()

    if (error || !venue) {
      throw new NotFoundException("Venue not found")
    }

    const { data: membership } = await this.supabase.admin
      .from("supplier_members")
      .select("supplier_id")
      .eq("user_id", userId)
      .eq("supplier_id", venue.supplier_id)
      .eq("is_active", true)
      .limit(1)
      .single()

    if (!membership) {
      throw new ForbiddenException("You do not manage this venue")
    }

    return venue
  }

  // ─── Venues ───────────────────────────────────────────────────────────────

  async findMine(userId: string) {
    const supplierId = await this.getSupplierIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from("venues")
      .select(`
        *,
        rooms (
          id, name, name_vi, description, capacity, price_per_hour,
          category, status, verified, noise_level, specs, specs_vi,
          created_at, updated_at,
          room_amenities ( amenity ),
          room_vibe_tags ( vibe_tag )
        )
      `)
      .eq("supplier_id", supplierId)
      .neq("status", "suspended")
      .order("created_at", { ascending: false })
      .returns<(VenueRow & { rooms: RoomRow[] })[]>()

    if (error) throw new Error(error.message)

    return (data ?? []).map(v => this.toVenueResponse(v))
  }

  async create(userId: string, dto: CreateVenueDto) {
    const supplierId = await this.getSupplierIdForUser(userId)

    const { data, error } = await this.supabase.admin
      .from("venues")
      .insert({
        supplier_id: supplierId,
        name: dto.name,
        name_vi: dto.nameVi ?? null,
        description: dto.description ?? null,
        description_vi: dto.descriptionVi ?? null,
        address: dto.address,
        address_vi: dto.addressVi ?? null,
        district: dto.district,
        city: dto.city ?? "Ho Chi Minh City",
        phone: dto.phone ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        status: "draft",
      })
      .select("*")
      .single<VenueRow>()

    if (error || !data) throw new Error(error?.message ?? "Failed to create venue")

    return this.toVenueResponse(data)
  }

  async update(venueId: string, userId: string, dto: UpdateVenueDto) {
    await this.verifyVenueOwnership(venueId, userId)

    const updates: Record<string, unknown> = {}
    if (dto.name !== undefined) updates.name = dto.name
    if (dto.nameVi !== undefined) updates.name_vi = dto.nameVi
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.descriptionVi !== undefined) updates.description_vi = dto.descriptionVi
    if (dto.address !== undefined) updates.address = dto.address
    if (dto.addressVi !== undefined) updates.address_vi = dto.addressVi
    if (dto.district !== undefined) updates.district = dto.district
    if (dto.city !== undefined) updates.city = dto.city
    if (dto.phone !== undefined) updates.phone = dto.phone
    if (dto.lat !== undefined) updates.lat = dto.lat
    if (dto.lng !== undefined) updates.lng = dto.lng

    const { data, error } = await this.supabase.admin
      .from("venues")
      .update(updates)
      .eq("id", venueId)
      .select("*")
      .single<VenueRow>()

    if (error || !data) throw new NotFoundException("Venue not found")

    return this.toVenueResponse(data)
  }

  // ─── Rooms (nested under venue) ───────────────────────────────────────────

  async findRooms(venueId: string, userId: string) {
    await this.verifyVenueOwnership(venueId, userId)

    const { data, error } = await this.supabase.admin
      .from("rooms")
      .select(`
        *, room_amenities(amenity), room_vibe_tags(vibe_tag)
      `)
      .eq("venue_id", venueId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .returns<RoomRow[]>()

    if (error) throw new Error(error.message)

    return (data ?? []).map(r => this.toRoomResponse(r))
  }

  async createRoom(venueId: string, userId: string, dto: CreateRoomDto) {
    await this.verifyVenueOwnership(venueId, userId)

    const { data: room, error } = await this.supabase.admin
      .from("rooms")
      .insert({
        venue_id: venueId,
        name: dto.name,
        name_vi: dto.nameVi ?? null,
        description: dto.description,
        description_vi: dto.descriptionVi ?? null,
        capacity: dto.capacity,
        price_per_hour: dto.pricePerHour,
        category: dto.category,
        specs: dto.specs ?? {},
        specs_vi: dto.specsVi ?? {},
        noise_level: dto.noiseLevel ?? null,
        status: "draft",
      })
      .select("*")
      .single<RoomRow>()

    if (error || !room) throw new Error(error?.message ?? "Failed to create room")

    if (dto.amenities?.length) {
      await this.supabase.admin
        .from("room_amenities")
        .upsert(dto.amenities.map(a => ({ room_id: room.id, amenity: a })))
    }

    if (dto.vibeTags?.length) {
      await this.supabase.admin
        .from("room_vibe_tags")
        .upsert(dto.vibeTags.map(v => ({ room_id: room.id, vibe_tag: v })))
    }

    return this.toRoomResponse({
      ...room,
      room_amenities: (dto.amenities ?? []).map(a => ({ amenity: a })),
      room_vibe_tags: (dto.vibeTags ?? []).map(v => ({ vibe_tag: v })),
    })
  }

  // ─── Response transformers ────────────────────────────────────────────────

  toVenueResponse(venue: VenueRow & { rooms?: RoomRow[] }) {
    return {
      id: venue.id,
      supplierId: venue.supplier_id,
      name: venue.name,
      nameVi: venue.name_vi,
      description: venue.description,
      descriptionVi: venue.description_vi,
      address: venue.address,
      addressVi: venue.address_vi,
      district: venue.district,
      city: venue.city,
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone,
      imageUrl: venue.image_url,
      status: venue.status,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at,
      rooms: (venue.rooms ?? []).map(r => this.toRoomResponse(r)),
    }
  }

  toRoomResponse(room: RoomRow) {
    return {
      id: room.id,
      venueId: room.venue_id,
      name: room.name,
      nameVi: room.name_vi,
      description: room.description,
      descriptionVi: room.description_vi,
      capacity: room.capacity,
      pricePerHour: room.price_per_hour,
      category: room.category,
      status: room.status,
      verified: room.verified,
      noiseLevel: room.noise_level,
      specs: room.specs ?? {},
      specsVi: room.specs_vi ?? {},
      amenities: (room.room_amenities ?? []).map(a => a.amenity),
      vibeTags: (room.room_vibe_tags ?? []).map(v => v.vibe_tag),
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    }
  }
}
