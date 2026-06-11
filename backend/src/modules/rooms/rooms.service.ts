import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { UpdateRoomDto } from "./dto/update-room.dto"
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto"
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
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  private async verifyRoomOwnership(roomId: string, userId: string): Promise<RoomRow> {
    const { data: room, error } = await this.supabase.admin
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .neq("status", "archived")
      .single<RoomRow>()

    if (error || !room) throw new NotFoundException("Room not found")

    // Delegates to venues service to check membership
    await this.venuesService.verifyVenueOwnership(room.venue_id, userId)

    return room
  }

  async update(roomId: string, userId: string, dto: UpdateRoomDto) {
    const room = await this.verifyRoomOwnership(roomId, userId)

    const updates: Record<string, unknown> = {}
    if (dto.name !== undefined) updates.name = dto.name
    if (dto.nameVi !== undefined) updates.name_vi = dto.nameVi
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.descriptionVi !== undefined) updates.description_vi = dto.descriptionVi
    if (dto.capacity !== undefined) updates.capacity = dto.capacity
    if (dto.pricePerHour !== undefined) updates.price_per_hour = dto.pricePerHour
    if (dto.category !== undefined) updates.category = dto.category
    if (dto.specs !== undefined) updates.specs = dto.specs
    if (dto.specsVi !== undefined) updates.specs_vi = dto.specsVi
    if (dto.noiseLevel !== undefined) updates.noise_level = dto.noiseLevel

    const { data: updatedRoom, error } = await this.supabase.admin
      .from("rooms")
      .update(updates)
      .eq("id", roomId)
      .select("*")
      .single<RoomRow>()

    if (error || !updatedRoom) throw new NotFoundException("Room not found")

    // Replace amenities if provided
    if (dto.amenities !== undefined) {
      await this.supabase.admin.from("room_amenities").delete().eq("room_id", roomId)
      if (dto.amenities.length > 0) {
        await this.supabase.admin
          .from("room_amenities")
          .insert(dto.amenities.map(a => ({ room_id: roomId, amenity: a })))
      }
    }

    // Replace vibe tags if provided
    if (dto.vibeTags !== undefined) {
      await this.supabase.admin.from("room_vibe_tags").delete().eq("room_id", roomId)
      if (dto.vibeTags.length > 0) {
        await this.supabase.admin
          .from("room_vibe_tags")
          .insert(dto.vibeTags.map(v => ({ room_id: roomId, vibe_tag: v })))
      }
    }

    const finalAmenities = dto.amenities ?? (room.room_amenities ?? []).map(a => a.amenity)
    const finalVibeTags = dto.vibeTags ?? (room.room_vibe_tags ?? []).map(v => v.vibe_tag)

    return this.venuesService.toRoomResponse({
      ...updatedRoom,
      room_amenities: finalAmenities.map(a => ({ amenity: a })),
      room_vibe_tags: finalVibeTags.map(v => ({ vibe_tag: v })),
    })
  }

  async updateStatus(roomId: string, userId: string, dto: UpdateRoomStatusDto) {
    await this.verifyRoomOwnership(roomId, userId)

    const { data, error } = await this.supabase.admin
      .from("rooms")
      .update({ status: dto.status })
      .eq("id", roomId)
      .select(`*, room_amenities(amenity), room_vibe_tags(vibe_tag)`)
      .single<RoomRow>()

    if (error || !data) throw new NotFoundException("Room not found")

    return this.venuesService.toRoomResponse(data)
  }

  async archive(roomId: string, userId: string) {
    await this.verifyRoomOwnership(roomId, userId)

    const { error } = await this.supabase.admin
      .from("rooms")
      .update({ status: "archived" })
      .eq("id", roomId)

    if (error) throw new Error(error.message)

    return { success: true }
  }
}
