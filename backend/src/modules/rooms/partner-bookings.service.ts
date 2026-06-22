import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { VenuesService } from "./venues.service"

const VALID_STATUSES = ["confirmed", "arriving", "checked_in", "completed", "cancelled", "pending", "no_show"] as const
type BookingStatus = typeof VALID_STATUSES[number]

@Injectable()
export class PartnerBookingsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  async listBookings(userId: string, date: string, status?: string) {
    const supplierId = await this.venuesService.getSupplierIdForUser(userId)

    const { data: venueRows } = await this.supabase.admin
      .from("venues")
      .select("id")
      .eq("supplier_id", supplierId)
    const venueIds = (venueRows ?? []).map(v => v.id as string)
    if (venueIds.length === 0) return []

    const { data: roomRows } = await this.supabase.admin
      .from("rooms")
      .select("id")
      .in("venue_id", venueIds)
      .neq("status", "archived")
    const roomIds = (roomRows ?? []).map(r => r.id as string)
    if (roomIds.length === 0) return []

    let query = this.supabase.admin
      .from("bookings")
      .select("id, booking_code, booking_date, start_time, end_time, status, checked_in_at, subtotal, platform_fee, rooms(name), profiles(full_name, email)")
      .in("room_id", roomIds)
      .eq("booking_date", date)
      .order("start_time", { ascending: true })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return (data ?? []).map((b: any) => ({
      id: b.id,
      bookingCode: b.booking_code ?? b.id.slice(0, 8).toUpperCase(),
      date: b.booking_date,
      startTime: this.utcToVietnam(b.start_time),
      endTime: this.utcToVietnam(b.end_time),
      status: b.status,
      checkedInAt: b.checked_in_at,
      roomName: b.rooms?.name ?? "Room",
      guestName: b.profiles?.full_name ?? b.profiles?.email ?? "Guest",
      subtotal: b.subtotal,
      platformFee: b.platform_fee,
    }))
  }

  async updateStatus(userId: string, bookingId: string, status: BookingStatus) {
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`)
    }

    const supplierId = await this.venuesService.getSupplierIdForUser(userId)

    // Fetch booking
    const { data: booking, error: bErr } = await this.supabase.admin
      .from("bookings")
      .select("id, status, checked_in_at, room_id")
      .eq("id", bookingId)
      .single<{ id: string; status: string; checked_in_at: string | null; room_id: string }>()

    if (bErr || !booking) throw new NotFoundException("Booking not found")

    // Verify ownership via room→venue→supplier
    const { data: room } = await this.supabase.admin
      .from("rooms")
      .select("venue_id")
      .eq("id", booking.room_id)
      .single<{ venue_id: string }>()
    if (!room) throw new NotFoundException("Room not found")

    const { data: venue } = await this.supabase.admin
      .from("venues")
      .select("id")
      .eq("id", room.venue_id)
      .eq("supplier_id", supplierId)
      .single()
    if (!venue) throw new ForbiddenException("This booking is not for your venue")

    const updateData: Record<string, unknown> = { status }
    if (status === "checked_in" && !booking.checked_in_at) {
      updateData.checked_in_at = new Date().toISOString()
    }

    const { error: uErr } = await this.supabase.admin
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)

    if (uErr) throw new Error(`Status update failed: ${uErr.message}`)

    return { id: bookingId, status, updated: true }
  }

  private utcToVietnam(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
  }
}
