import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { UpdateRoomDto } from "./dto/update-room.dto"
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto"
import { UpdateSlotsDto } from "./dto/update-slots.dto"
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
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.capacity !== undefined) updates.capacity = dto.capacity
    if (dto.pricePerHour !== undefined) updates.price_per_hour = dto.pricePerHour
    if (dto.category !== undefined) updates.category = dto.category
    if (dto.specs !== undefined) updates.specs = dto.specs
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

  async getSlots(roomId: string, userId: string, date: string) {
    // Fetch room + venue hours in one query
    const { data: room, error: roomErr } = await this.supabase.admin
      .from("rooms")
      .select("venue_id, venues(open_time, close_time)")
      .eq("id", roomId)
      .single<{ venue_id: string; venues: { open_time: string; close_time: string } }>()

    if (roomErr || !room) throw new NotFoundException("Room not found")
    await this.venuesService.verifyVenueOwnership(room.venue_id, userId)

    // Fetch only the exception rows (blocked slots) — O(blocks) not O(all slots)
    const { data: blocks, error: blocksErr } = await this.supabase.admin
      .from("room_blocks")
      .select("id, start_time")
      .eq("room_id", roomId)
      .eq("date", date)

    if (blocksErr) throw new Error(blocksErr.message)

    const blockMap = new Map(
      (blocks ?? []).map(b => [(b.start_time as string).slice(0, 5), b.id as string])
    )

    // Overlay confirmed/pending bookings so partners see booked slots as occupied
    // bookings.start_time is timestamptz; use a UTC-day range that covers venue hours (UTC+7)
    const startDayUtc = new Date(new Date(date + "T00:00:00Z").getTime() - 7 * 3600000).toISOString()
    const endDayUtc = new Date(new Date(date + "T00:00:00Z").getTime() + 17 * 3600000).toISOString()
    const { data: activeBookings } = await this.supabase.admin
      .from("bookings")
      .select("start_time, end_time")
      .eq("room_id", roomId)
      .gte("start_time", startDayUtc)
      .lt("start_time", endDayUtc)
      .neq("status", "cancelled")

    // Expand each booking into 30-min slot keys (convert UTC → Vietnam UTC+7)
    const bookedSlots = new Set<string>()
    for (const bk of (activeBookings ?? [])) {
      let cur = new Date(bk.start_time as string).getTime() + 7 * 3600000
      const end = new Date(bk.end_time as string).getTime() + 7 * 3600000
      while (cur < end) {
        const d = new Date(cur)
        bookedSlots.add(
          `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
        )
        cur += 1800000
      }
    }

    // Generate slots on-demand from venue hours — zero DB rows needed for available slots
    return this.buildSlotList(room.venues.open_time, room.venues.close_time, blockMap, bookedSlots)
  }

  async updateSlots(roomId: string, userId: string, dto: UpdateSlotsDto) {
    const { data: room, error: roomErr } = await this.supabase.admin
      .from("rooms")
      .select("venue_id")
      .eq("id", roomId)
      .single<{ venue_id: string }>()

    if (roomErr || !room) throw new NotFoundException("Room not found")
    await this.venuesService.verifyVenueOwnership(room.venue_id, userId)

    if (dto.status === "blocked") {
      // Upsert block rows — safe to call multiple times
      const rows = dto.startTimes.map(start => ({
        room_id: roomId,
        date: dto.date,
        start_time: start,
        end_time: this.addMinutes(start, 30),
        blocked_by: userId,
        reason: "manual",
      }))
      const { error } = await this.supabase.admin
        .from("room_blocks")
        .upsert(rows, { onConflict: "room_id,date,start_time" })
      if (error) throw new Error(error.message)
    } else {
      // Remove block rows — slot reverts to "available" (computed)
      const { error } = await this.supabase.admin
        .from("room_blocks")
        .delete()
        .eq("room_id", roomId)
        .eq("date", dto.date)
        .in("start_time", dto.startTimes)
      if (error) throw new Error(error.message)
    }

    return { updated: dto.startTimes.length }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildSlotList(
    openTime: string,
    closeTime: string,
    blockMap: Map<string, string>,
    bookedSlots: Set<string> = new Set(),
  ) {
    const slots: {
      id: string; startTime: string; endTime: string
      status: string; available: boolean; heldUntil: null
    }[] = []

    let current = this.timeToMinutes(openTime)
    const close  = this.timeToMinutes(closeTime)

    while (current < close) {
      const start    = this.minutesToTime(current)
      const end      = this.minutesToTime(current + 30)
      const blockId  = blockMap.get(start)
      const isBooked = bookedSlots.has(start)
      slots.push({
        id:        blockId ? blockId : isBooked ? `booked-${start}` : `virtual-${start}`,
        startTime: start,
        endTime:   end,
        status:    blockId ? "blocked" : isBooked ? "booked" : "available",
        available: !blockId && !isBooked,
        heldUntil: null,
      })
      current += 30
    }

    return slots
  }

  private addMinutes(time: string, minutes: number): string {
    return this.minutesToTime(this.timeToMinutes(time) + minutes)
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.slice(0, 5).split(":").map(Number)
    return h * 60 + m
  }

  private minutesToTime(minutes: number): string {
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
  }

  async saveImages(roomId: string, userId: string, urls: string[]) {
    await this.verifyRoomOwnership(roomId, userId)

    const { data: existing } = await this.supabase.admin
      .from("room_images")
      .select("sort_order")
      .eq("room_id", roomId)
      .order("sort_order", { ascending: false })
      .limit(1)

    const nextOrder = ((existing?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1

    const rows = urls.map((url, i) => ({
      room_id: roomId,
      image_url: url,
      sort_order: nextOrder + i,
    }))

    const { error } = await this.supabase.admin.from("room_images").insert(rows)
    if (error) throw new Error(error.message)

    return { saved: urls.length }
  }

  async deleteImage(imageId: string, roomId: string, userId: string) {
    await this.verifyRoomOwnership(roomId, userId)

    const { error } = await this.supabase.admin
      .from("room_images")
      .delete()
      .eq("id", imageId)
      .eq("room_id", roomId)

    if (error) throw new Error(error.message)

    return { deleted: true }
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
