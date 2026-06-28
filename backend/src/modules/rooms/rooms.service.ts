import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { UpdateRoomDto } from "./dto/update-room.dto"
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto"
import { UpdateSlotsDto } from "./dto/update-slots.dto"
import { VenuesService } from "./venues.service"

/** Booking/blocking granularity — whole-hour slots (e.g. 07:00, 08:00 ... 21:00). */
const SLOT_MINUTES = 60

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
    const { data: room, error: roomErr } = await this.supabase.admin
      .from("rooms")
      .select("venue_id, venues(open_time, close_time)")
      .eq("id", roomId)
      .single<{ venue_id: string; venues: { open_time: string; close_time: string } }>()

    if (roomErr || !room) throw new NotFoundException("Room not found")
    await this.venuesService.verifyVenueOwnership(room.venue_id, userId)

    return this.computeSlots(roomId, room.venues.open_time, room.venues.close_time, date)
  }

  /** Guest-facing slot lookup — no ownership check, only published rooms. */
  async getPublicSlots(roomId: string, date: string) {
    const { data: room, error: roomErr } = await this.supabase.admin
      .from("rooms")
      .select("status, venues(open_time, close_time, status)")
      .eq("id", roomId)
      .single<{ status: string; venues: { open_time: string; close_time: string; status: string } }>()

    if (roomErr || !room || room.status !== "published" || room.venues.status !== "published") {
      throw new NotFoundException("Room not found")
    }

    return this.computeSlots(roomId, room.venues.open_time, room.venues.close_time, date)
  }

  private async computeSlots(roomId: string, openTime: string, closeTime: string, date: string) {
    // Fetch only the exception rows (blocked slots) — O(blocks) not O(all slots)
    const { data: blocks, error: blocksErr } = await this.supabase.admin
      .from("room_blocks")
      .select("id, start_time, end_time")
      .eq("room_id", roomId)
      .eq("date", date)

    if (blocksErr) throw new Error(blocksErr.message)

    const blockRanges = (blocks ?? []).map(b => ({
      id: b.id as string,
      start: this.timeToMinutes((b.start_time as string).slice(0, 5)),
      end: this.timeToMinutes((b.end_time as string).slice(0, 5)),
    }))

    // Overlay confirmed/pending bookings so everyone sees booked slots as occupied
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

    // Convert each booking's UTC range into Vietnam-local minutes-since-midnight
    const bookingRanges = (activeBookings ?? []).map(bk => {
      const startVn = new Date(bk.start_time as string).getTime() + 7 * 3600000
      const endVn = new Date(bk.end_time as string).getTime() + 7 * 3600000
      const startD = new Date(startVn)
      const endD = new Date(endVn)
      return {
        start: startD.getUTCHours() * 60 + startD.getUTCMinutes(),
        end: endD.getUTCHours() * 60 + endD.getUTCMinutes(),
      }
    })

    // Generate slots on-demand from venue hours — zero DB rows needed for available slots
    const nowVn = this.getNowVietnam()
    const nowMinutes = date === nowVn.date ? nowVn.hour * 60 + nowVn.minute : null
    return this.buildSlotList(openTime, closeTime, blockRanges, bookingRanges, nowMinutes)
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
        end_time: this.addMinutes(start, SLOT_MINUTES),
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
    blockRanges: { id: string; start: number; end: number }[],
    bookingRanges: { start: number; end: number }[] = [],
    nowMinutes: number | null = null,
  ) {
    const slots: {
      id: string; startTime: string; endTime: string
      status: string; available: boolean; heldUntil: null
    }[] = []

    let current = this.timeToMinutes(openTime)
    const close  = this.timeToMinutes(closeTime)

    while (current < close) {
      const slotEnd  = current + SLOT_MINUTES
      const start    = this.minutesToTime(current)
      const end      = this.minutesToTime(slotEnd)
      // Overlap test: a block/booking touches this slot if it starts before the slot ends
      // and ends after the slot starts.
      const block    = blockRanges.find(b => b.start < slotEnd && b.end > current)
      const isBooked = bookingRanges.some(b => b.start < slotEnd && b.end > current)
      const isPast   = nowMinutes !== null && current < nowMinutes
      slots.push({
        id:        block ? block.id : isBooked ? `booked-${start}` : `virtual-${start}`,
        startTime: start,
        endTime:   end,
        status:    isPast ? "past" : block ? "blocked" : isBooked ? "booked" : "available",
        available: !isPast && !block && !isBooked,
        heldUntil: null,
      })
      current += SLOT_MINUTES
    }

    return slots
  }

  private getNowVietnam(): { date: string; hour: number; minute: number } {
    const now = new Date()
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
    const vn = new Date(utcMs + 7 * 3_600_000)
    const date = `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, "0")}-${String(vn.getDate()).padStart(2, "0")}`
    return { date, hour: vn.getHours(), minute: vn.getMinutes() }
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
