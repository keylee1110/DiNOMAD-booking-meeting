import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { VenuesService } from "./venues.service"

type BookingRow = {
  id: string
  booking_code: string | null
  booking_date: string
  start_time: string
  end_time: string
  status: string
  checked_in_at: string | null
  subtotal: number
  platform_fee: number
  room_id: string
  customer_id: string
}

type ResolvedBooking = BookingRow & {
  roomName: string
  venueName: string
  guestName: string
  guestPhone: string | null
}

@Injectable()
export class ScannerService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  async lookup(userId: string, bookingCode: string) {
    try {
      const supplierId = await this.venuesService.getSupplierIdForUser(userId)

      const { data: booking, error } = await this.supabase.admin
        .from("bookings")
        .select("id, booking_code, booking_date, start_time, end_time, status, checked_in_at, subtotal, platform_fee, room_id, customer_id")
        .eq("booking_code", bookingCode.trim().toUpperCase())
        .single<BookingRow>()

      if (error || !booking) {
        console.error("lookup booking error:", error)
        throw new NotFoundException("Booking not found")
      }

      return this.toResponse(await this.resolve(booking, supplierId))
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException) throw err
      console.error("lookup unexpected error:", err)
      throw new InternalServerErrorException(String(err))
    }
  }

  async checkIn(userId: string, bookingId: string) {
    try {
      const supplierId = await this.venuesService.getSupplierIdForUser(userId)
      const booking = await this.fetchAndAuthorize(bookingId, supplierId)

      if (booking.status === "cancelled") throw new BadRequestException("Booking is cancelled")
      if (booking.status === "no_show")   throw new BadRequestException("Booking was marked no-show")
      if (booking.status === "completed") throw new BadRequestException("Session already ended")
      if (booking.status === "pending")   throw new BadRequestException("Booking not yet confirmed")
      if (booking.checked_in_at)          throw new BadRequestException("Already checked in")

      const checkedInAt = new Date().toISOString()
      const { error } = await this.supabase.admin
        .from("bookings")
        .update({ checked_in_at: checkedInAt, status: "checked_in" })
        .eq("id", bookingId)

      if (error) {
        console.error("checkIn update error:", error)
        throw new InternalServerErrorException(`Check-in failed: ${error.message}`)
      }

      const resolved = await this.resolve({ ...booking, checked_in_at: checkedInAt, status: "checked_in" }, supplierId)
      return this.toResponse(resolved)
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err
      console.error("checkIn unexpected error:", err)
      throw new InternalServerErrorException(String(err))
    }
  }

  async markNoShow(userId: string, bookingId: string) {
    try {
      const supplierId = await this.venuesService.getSupplierIdForUser(userId)
      const booking = await this.fetchAndAuthorize(bookingId, supplierId)

      if (booking.status === "cancelled") throw new BadRequestException("Booking is already cancelled")
      if (booking.status === "no_show")   throw new BadRequestException("Already marked as no-show")
      if (booking.status === "completed") throw new BadRequestException("Completed bookings cannot be marked no-show")
      if (booking.checked_in_at)          throw new BadRequestException("Guest already checked in — cannot mark no-show")

      const { error } = await this.supabase.admin
        .from("bookings")
        .update({ status: "no_show" })
        .eq("id", bookingId)

      if (error) {
        console.error("markNoShow update error:", error)
        throw new InternalServerErrorException(`No-show update failed: ${error.message}`)
      }

      const resolved = await this.resolve({ ...booking, status: "no_show" }, supplierId)
      return this.toResponse(resolved)
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException || err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err
      console.error("markNoShow unexpected error:", err)
      throw new InternalServerErrorException(String(err))
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async fetchAndAuthorize(bookingId: string, supplierId: string): Promise<BookingRow> {
    const { data: booking, error } = await this.supabase.admin
      .from("bookings")
      .select("id, booking_code, booking_date, start_time, end_time, status, checked_in_at, subtotal, platform_fee, room_id, customer_id")
      .eq("id", bookingId)
      .single<BookingRow>()

    if (error || !booking) {
      console.error("fetchAndAuthorize error:", error)
      throw new NotFoundException("Booking not found")
    }

    // Verify the room belongs to this supplier's venue
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

    return booking
  }

  private async resolve(booking: BookingRow, supplierId: string): Promise<ResolvedBooking> {
    // Verify ownership and get room + venue name
    const { data: room } = await this.supabase.admin
      .from("rooms")
      .select("name, venue_id")
      .eq("id", booking.room_id)
      .single<{ name: string; venue_id: string }>()

    const { data: venue } = await this.supabase.admin
      .from("venues")
      .select("name, supplier_id")
      .eq("id", room?.venue_id ?? "")
      .single<{ name: string; supplier_id: string }>()

    if (!venue || venue.supplier_id !== supplierId) {
      throw new ForbiddenException("This booking is not for your venue")
    }

    const { data: profile } = await this.supabase.admin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", booking.customer_id)
      .single<{ full_name: string | null; email: string; phone: string | null }>()

    return {
      ...booking,
      roomName: room?.name ?? "Unknown room",
      venueName: venue?.name ?? "Unknown venue",
      guestName: profile?.full_name ?? profile?.email ?? "Unknown guest",
      guestPhone: profile?.phone ?? null,
    }
  }

  private toResponse(b: ResolvedBooking) {
    return {
      id: b.id,
      bookingCode: b.booking_code,
      date: b.booking_date,
      startTime: this.utcToVietnam(b.start_time),
      endTime: this.utcToVietnam(b.end_time),
      status: b.status,
      checkedInAt: b.checked_in_at,
      roomName: b.roomName,
      venueName: b.venueName,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      subtotal: b.subtotal,
      platformFee: b.platform_fee,
    }
  }

  private utcToVietnam(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
  }
}
