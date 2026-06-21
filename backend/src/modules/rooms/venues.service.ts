import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreateVenueDto } from "./dto/create-venue.dto"
import { UpdateVenueDto } from "./dto/update-venue.dto"
import { CreateRoomDto } from "./dto/create-room.dto"

type VenueRow = {
  id: string
  supplier_id: string
  name: string
  description: string | null
  address: string
  district: string
  city: string
  lat: number | null
  lng: number | null
  phone: string | null
  image_url: string | null
  status: string
  open_time: string   // "07:00"
  close_time: string  // "22:00"
  created_at: string
  updated_at: string
}

type RoomImageRow = {
  id: string
  image_url: string
  sort_order: number
}

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
  room_images?: RoomImageRow[]
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
      .single();

    if (error) {
      throw new ForbiddenException(`User is not a supplier: ${error.message}`);
    }

    if (!data) {
      throw new ForbiddenException("You do not have a supplier account");
    }

    return data.supplier_id as string;
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
    console.error("Finding venues for supplier", supplierId)

    const { data, error } = await this.supabase.admin
      .from("venues")
      .select(`
        *,
        rooms (
          id, name, description, capacity, price_per_hour,
          category, status, verified, noise_level, specs,
          created_at, updated_at,
          room_amenities ( amenity ),
          room_vibe_tags ( vibe_tag ),
          room_images ( id, image_url, sort_order )
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
    console.log('📍 VenuesService.create()');
    console.log('userId:', userId);
    console.log('dto:', dto);

    try {
      console.log('🔍 Getting supplierId for user...');
      const supplierId = await this.getSupplierIdForUser(userId);
      console.log('✅ supplierId:', supplierId);

      console.log('🔍 Inserting venue into database...');
      const { data, error } = await this.supabase.admin
        .from("venues")
        .insert({
          supplier_id: supplierId,
          name: dto.name,
          description: dto.description ?? null,
          address: dto.address,
          district: dto.district,
          city: dto.city ?? "Ho Chi Minh City",
          phone: dto.phone ?? null,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          status: "draft",
          open_time: dto.openTime ?? "07:00",
          close_time: dto.closeTime ?? "22:00",
        })
        .select("*")
        .single<VenueRow>();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from insert');
        throw new Error("Failed to create venue - no data returned");
      }

      console.log('✅ Venue created successfully:', data);
      return this.toVenueResponse(data);
    } catch (err) {
      console.error('❌ ERROR in create():', err);
      throw err;
    }
  }

  async update(venueId: string, userId: string, dto: UpdateVenueDto) {
    await this.verifyVenueOwnership(venueId, userId)

    const updates: Record<string, unknown> = {}
    if (dto.name !== undefined) updates.name = dto.name
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.address !== undefined) updates.address = dto.address
    if (dto.district !== undefined) updates.district = dto.district
    if (dto.city !== undefined) updates.city = dto.city
    if (dto.phone !== undefined) updates.phone = dto.phone
    if (dto.lat !== undefined) updates.lat = dto.lat
    if (dto.lng !== undefined) updates.lng = dto.lng
    if (dto.openTime !== undefined) updates.open_time = dto.openTime
    if (dto.closeTime !== undefined) updates.close_time = dto.closeTime

    const { data, error } = await this.supabase.admin
      .from("venues")
      .update(updates)
      .eq("id", venueId)
      .select("*")
      .single<VenueRow>()

    if (error || !data) throw new NotFoundException("Venue not found")

    return this.toVenueResponse(data)
  }

  async updateStatus(venueId: string, userId: string, status: "published" | "draft" | "suspended") {
    await this.verifyVenueOwnership(venueId, userId)

    const { data, error } = await this.supabase.admin
      .from("venues")
      .update({ status })
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
        description: dto.description ?? "",
        capacity: dto.capacity,
        price_per_hour: dto.pricePerHour,
        category: dto.category,
        specs: dto.specs ?? {},
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
      description: venue.description,
      address: venue.address,
      district: venue.district,
      city: venue.city,
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone,
      imageUrl: venue.image_url,
      status: venue.status,
      openTime: venue.open_time,
      closeTime: venue.close_time,
      createdAt: venue.created_at,
      updatedAt: venue.updated_at,
      rooms: (venue.rooms ?? []).filter(r => r.status !== "archived").map(r => this.toRoomResponse(r)),
    }
  }

  toRoomResponse(room: RoomRow) {
    return {
      id: room.id,
      venueId: room.venue_id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      pricePerHour: room.price_per_hour,
      category: room.category,
      status: room.status,
      verified: room.verified,
      noiseLevel: room.noise_level,
      specs: room.specs ?? {},
      amenities: (room.room_amenities ?? []).map(a => a.amenity),
      vibeTags: (room.room_vibe_tags ?? []).map(v => v.vibe_tag),
      images: (room.room_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => ({ id: img.id, imageUrl: img.image_url, sortOrder: img.sort_order })),
      createdAt: room.created_at,
      updatedAt: room.updated_at,
    }
  }
}
