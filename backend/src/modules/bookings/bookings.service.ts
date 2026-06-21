import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { CreateBookingDto } from "./dto/create-booking.dto"

const PLATFORM_FEE_RATE = 0.1
const DEPOSIT_ROOM_RATE = 0.2 // deposit = 20% of room fee + full platform fee
const POINTS_EARN_RATE = 0.01 // earn 1% of paid total as points

type RoomRow = {
  id: string
  price_per_hour: number
  status: string
  venue_id: string
}

type VenueRow = {
  status: string
  open_time: string // "07:00:00" or "07:00"
  close_time: string
}

type BookingRow = {
  id: string
  booking_code: string | null
  booking_date: string
  start_time: string
  end_time: string
  status: string
  subtotal: number
  platform_fee: number
  total_amount: number
  points_redeemed: number
  points_earned: number
  payment_status: string | null
  qr_code_token: string | null
  created_at: string
}

@Injectable()
export class BookingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateBookingDto) {
    // 1. Resolve room (must be published)
    const { data: room, error: roomErr } = await this.supabase.admin
      .from("rooms")
      .select("id, price_per_hour, status, venue_id")
      .eq("id", dto.roomId)
      .maybeSingle<RoomRow>()

    if (roomErr) throw new InternalServerErrorException(roomErr.message)
    if (!room) throw new NotFoundException("Room not found")
    if (room.status !== "published") {
      throw new BadRequestException("This room is not available for booking")
    }

    // 2. Resolve venue (open/close hours, must be published)
    const { data: venue, error: venueErr } = await this.supabase.admin
      .from("venues")
      .select("status, open_time, close_time")
      .eq("id", room.venue_id)
      .maybeSingle<VenueRow>()

    if (venueErr) throw new InternalServerErrorException(venueErr.message)
    if (!venue || venue.status !== "published") {
      throw new BadRequestException("This venue is not available for booking")
    }

    // 3. Validate the time range
    const durationHours = this.validateTimeRange(
      dto.date,
      dto.startTime,
      dto.endTime,
      venue.open_time,
      venue.close_time,
    )

    // 4. Recompute every amount server-side (client values are ignored)
    const roomFee = room.price_per_hour * durationHours
    const platformFee = Math.round(roomFee * PLATFORM_FEE_RATE)
    const gross = roomFee + platformFee

    const profilePoints = await this.getProfilePoints(userId)
    const pointsRedeemed = dto.redeemPoints ? Math.min(gross, profilePoints) : 0
    const totalAmount = gross - pointsRedeemed
    const pointsEarned = Math.round(totalAmount * POINTS_EARN_RATE)

    const amountPaidNow =
      dto.paymentMode === "deposit"
        ? Math.max(0, Math.round(roomFee * DEPOSIT_ROOM_RATE + platformFee) - pointsRedeemed)
        : totalAmount

    const paymentStatus = dto.paymentMode === "deposit" ? "deposited" : "fully_paid"

    const startISO = this.toVietnamUTC(dto.date, dto.startTime)
    const endISO = this.toVietnamUTC(dto.date, dto.endTime)

    // 5. Insert as 'pending' — reserves the slot (overlap constraint) without
    //    touching loyalty points yet (the points trigger only fires on confirmed).
    const { data: pending, error: insertErr } = await this.supabase.admin
      .from("bookings")
      .insert({
        room_id: room.id,
        customer_id: userId,
        booking_date: dto.date,
        start_time: startISO,
        end_time: endISO,
        status: "pending",
        price_per_hour: room.price_per_hour,
        subtotal: roomFee,
        platform_fee: platformFee,
        total_amount: totalAmount,
        points_redeemed: pointsRedeemed,
        points_earned: pointsEarned,
        payment_status: paymentStatus,
      })
      .select("id")
      .single<{ id: string }>()

    if (insertErr || !pending) {
      // Postgres exclusion-constraint violation = slot already booked
      if (insertErr?.code === "23P01" || /overlap|exclu/i.test(insertErr?.message ?? "")) {
        throw new ConflictException("This time slot was just booked. Please choose another time.")
      }
      throw new InternalServerErrorException(insertErr?.message ?? "Failed to create booking")
    }

    const bookingId = pending.id

    // 6. Insert the payment row (simulated gateway — marked successful immediately)
    const { error: payErr } = await this.supabase.admin.from("payments").insert({
      booking_id: bookingId,
      payment_method: dto.paymentMethod,
      transaction_id: `SIM-${bookingId.slice(0, 8).toUpperCase()}`,
      amount: amountPaidNow,
      status: "successful",
      paid_at: new Date().toISOString(),
    })

    if (payErr) {
      await this.supabase.admin.from("bookings").delete().eq("id", bookingId)
      throw new InternalServerErrorException(`Payment record failed: ${payErr.message}`)
    }

    // 7. Flip pending → confirmed. This is where the loyalty-points trigger runs.
    const { error: confirmErr } = await this.supabase.admin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId)

    if (confirmErr) {
      await this.supabase.admin.from("payments").delete().eq("booking_id", bookingId)
      await this.supabase.admin.from("bookings").delete().eq("id", bookingId)
      throw new InternalServerErrorException(`Failed to confirm booking: ${confirmErr.message}`)
    }

    // 8. Re-fetch the canonical row and return it
    const { data: finalRow, error: fetchErr } = await this.supabase.admin
      .from("bookings")
      .select(
        "id, booking_code, booking_date, start_time, end_time, status, subtotal, platform_fee, total_amount, points_redeemed, points_earned, payment_status, qr_code_token, created_at",
      )
      .eq("id", bookingId)
      .single<BookingRow>()

    if (fetchErr || !finalRow) {
      throw new InternalServerErrorException(fetchErr?.message ?? "Booking saved but could not be read back")
    }

    return this.toResponse(finalRow, amountPaidNow)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getProfilePoints(userId: string): Promise<number> {
    const { data } = await this.supabase.admin
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .maybeSingle<{ points: number }>()
    return data?.points ?? 0
  }

  /** Validate alignment / ordering / hours / not-in-past; return duration in hours. */
  private validateTimeRange(
    date: string,
    startTime: string,
    endTime: string,
    openTime: string,
    closeTime: string,
  ): number {
    const start = this.toMinutes(startTime)
    const end = this.toMinutes(endTime)
    const open = this.toMinutes(openTime)
    const close = this.toMinutes(closeTime)

    if (start % 30 !== 0 || end % 30 !== 0) {
      throw new BadRequestException("Times must align to 30-minute slots")
    }
    if (end <= start) {
      throw new BadRequestException("End time must be after start time")
    }
    if (start < open || end > close) {
      throw new BadRequestException(`Booking must be within opening hours (${openTime}–${closeTime})`)
    }

    // Not in the past (compare against current Vietnam time)
    const startMs = new Date(this.toVietnamUTC(date, startTime)).getTime()
    if (startMs < Date.now()) {
      throw new BadRequestException("Cannot book a time in the past")
    }

    return (end - start) / 60
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number)
    return h * 60 + m
  }

  /** Treat date + "HH:MM" as Asia/Ho_Chi_Minh (UTC+7) and return a UTC ISO string. */
  private toVietnamUTC(date: string, time: string): string {
    const [h, m] = time.split(":").map(Number)
    const [year, month, day] = date.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day, h - 7, m, 0, 0)).toISOString()
  }

  private utcToVietnam(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
  }

  private toResponse(b: BookingRow, amountPaidNow: number) {
    return {
      id: b.id,
      bookingCode: b.booking_code ?? b.id.slice(0, 8).toUpperCase(),
      date: b.booking_date,
      startTime: this.utcToVietnam(b.start_time),
      endTime: this.utcToVietnam(b.end_time),
      status: b.status,
      subtotal: b.subtotal,
      platformFee: b.platform_fee,
      totalAmount: b.total_amount,
      pointsRedeemed: b.points_redeemed,
      pointsEarned: b.points_earned,
      amountPaidNow,
      paymentStatus: b.payment_status,
      qrCodeToken: b.qr_code_token,
      createdAt: b.created_at,
    }
  }
}
