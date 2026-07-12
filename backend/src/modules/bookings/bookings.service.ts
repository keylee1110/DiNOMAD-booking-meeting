import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"

@Injectable()
export class BookingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createHold(customerId: string, dto: { roomId: string; date: string; startTime: string; endTime: string; pointsRedeemed: number }) {
    const { data: room, error: roomError } = await this.supabase.admin.from("rooms")
      .select("id, price_per_hour, status, venues!inner(status)").eq("id", dto.roomId).single()
    const venue = Array.isArray(room?.venues) ? room?.venues[0] : room?.venues
    if (roomError || !room || room.status !== "published" || venue?.status !== "published") {
      throw new BadRequestException("Room is not available")
    }
    const start = this.vietnamTimeToUtc(dto.date, dto.startTime)
    const end = this.vietnamTimeToUtc(dto.date, dto.endTime)
    const durationHours = (end.getTime() - start.getTime()) / 3600000
    if (durationHours <= 0 || durationHours * 2 % 1 !== 0) throw new BadRequestException("Invalid booking duration")

    const subtotal = Math.round(Number(room.price_per_hour) * durationHours)
    const platformFee = Math.round(subtotal * 0.1)
    const pointsRedeemed = await this.validatePoints(customerId, dto.pointsRedeemed, subtotal + platformFee)
    const totalAmount = subtotal + platformFee - pointsRedeemed
    const bookingCode = `DN-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`
    const { data, error } = await this.supabase.admin.from("bookings").insert({
      room_id: dto.roomId, customer_id: customerId, booking_date: dto.date,
      start_time: start.toISOString(), end_time: end.toISOString(), status: "pending",
      price_per_hour: room.price_per_hour, subtotal, platform_fee: platformFee,
      total_amount: totalAmount, points_redeemed: pointsRedeemed,
      points_earned: Math.round(totalAmount * 0.01), booking_code: bookingCode, payment_status: "pending",
    }).select("id, booking_code, created_at, subtotal, platform_fee, total_amount, points_redeemed, points_earned").single()
    if (error) throw new BadRequestException("This time slot is already booked or held")
    return data
  }

  async findAllForAdmin() {
    const { data, error } = await this.supabase.admin
      .from("bookings")
      .select("id, booking_code, booking_date, start_time, end_time, subtotal, platform_fee, status, profiles(full_name, email), rooms(name, venues(name))")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map((booking: any) => ({
      id: booking.id,
      bookingCode: booking.booking_code ?? booking.id.slice(0, 8).toUpperCase(),
      customerName: booking.profiles?.full_name ?? booking.profiles?.email ?? "Guest",
      roomName: booking.rooms?.name ?? "Room",
      venueName: booking.rooms?.venues?.name ?? "Venue",
      bookingDate: booking.booking_date,
      startTime: String(booking.start_time).slice(0, 5),
      endTime: String(booking.end_time).slice(0, 5),
      total: Number(booking.subtotal ?? 0) + Number(booking.platform_fee ?? 0),
      status: booking.status,
    }))
  }

  async cancelPending(bookingId: string, customerId: string) {
    // 1. Fetch booking to verify ownership and state
    const { data: booking, error: fetchErr } = await this.supabase.admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (fetchErr || !booking) {
      throw new NotFoundException("Booking not found")
    }

    if (booking.customer_id !== customerId) {
      throw new BadRequestException("Unauthorized to modify this booking")
    }

    if (booking.status !== "pending") {
      throw new BadRequestException(`Cannot cancel booking in status: ${booking.status}`)
    }

    // 2. Update status to cancelled
    const { error: updateErr } = await this.supabase.admin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    if (updateErr) {
      throw new Error(`Failed to cancel booking: ${updateErr.message}`)
    }

    return { success: true, message: "Booking cancelled successfully" }
  }

  async updatePending(bookingId: string, customerId: string, dto: { pointsRedeemed: number }) {
    const { data: booking } = await this.supabase.admin.from("bookings")
      .select("subtotal, platform_fee").eq("id", bookingId).eq("customer_id", customerId).eq("status", "pending").maybeSingle()
    if (!booking) throw new BadRequestException("Pending booking not found or no longer editable")
    const grossTotal = Number(booking.subtotal) + Number(booking.platform_fee)
    const pointsRedeemed = await this.validatePoints(customerId, dto.pointsRedeemed, grossTotal)
    const totalAmount = grossTotal - pointsRedeemed
    const { data, error } = await this.supabase.admin.from("bookings")
      .update({
        total_amount: totalAmount,
        points_redeemed: pointsRedeemed,
        points_earned: Math.round(totalAmount * 0.01),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId).eq("customer_id", customerId).eq("status", "pending")
      .select("id").maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) throw new BadRequestException("Pending booking not found or no longer editable")
    return { success: true }
  }

  private async validatePoints(customerId: string, requested: number, total: number) {
    const { data } = await this.supabase.admin.from("profiles").select("points").eq("id", customerId).single()
    const balance = Number(data?.points ?? 0)
    if (requested > balance || requested > total) throw new BadRequestException("Invalid points redemption amount")
    return requested
  }

  private vietnamTimeToUtc(date: string, time: string) {
    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes))
  }
}
