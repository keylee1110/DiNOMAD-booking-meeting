import { Injectable } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { roomFeeHeldByPlatform } from "../../common/pricing"
import { VenuesService } from "./venues.service"

type BookingRow = {
  id: string
  booking_code: string | null
  booking_date: string
  start_time: string
  end_time: string
  status: string
  payment_status: string | null
  subtotal: number
  platform_fee: number
  checked_in_at: string | null
  rooms: { name: string }
  profiles: { full_name: string | null; email: string }
}

/** Booking statuses that represent money actually earned (guest has paid). */
const EARNED_STATUSES = ["confirmed", "checked_in", "completed"]

@Injectable()
export class EarningsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  async getEarnings(userId: string, startDate: string, endDate: string) {
    const supplierId = await this.venuesService.getSupplierIdForUser(userId)

    // Step 1: venue IDs for this supplier
    const { data: venueRows } = await this.supabase.admin
      .from("venues")
      .select("id")
      .eq("supplier_id", supplierId)

    const venueIds = (venueRows ?? []).map(v => v.id as string)
    if (venueIds.length === 0) return this.emptyResponse()

    // Step 2: room IDs for those venues (non-archived)
    const { data: roomRows } = await this.supabase.admin
      .from("rooms")
      .select("id")
      .in("venue_id", venueIds)
      .neq("status", "archived")

    const roomIds = (roomRows ?? []).map(r => r.id as string)
    if (roomIds.length === 0) return this.emptyResponse()

    // Step 3: bookings in date range for those rooms
    const { data: rawBookings, error } = await this.supabase.admin
      .from("bookings")
      .select(`
        id,
        booking_code,
        booking_date,
        start_time,
        end_time,
        status,
        payment_status,
        subtotal,
        platform_fee,
        checked_in_at,
        rooms(name),
        profiles(full_name, email)
      `)
      .in("room_id", roomIds)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate)
      .in("status", EARNED_STATUSES)
      .order("booking_date", { ascending: false })

    if (error) throw new Error(error.message)

    // Only paid bookings count as earnings — unpaid holds and cancelled
    // bookings are never the venue's money.
    const bookings = (rawBookings ?? []) as unknown as BookingRow[]

    // Chart: room-fee revenue + guest-paid platform fee grouped by day
    const dayMap = new Map<string, { revenue: number; commission: number }>()
    for (const b of bookings) {
      const prev = dayMap.get(b.booking_date) ?? { revenue: 0, commission: 0 }
      dayMap.set(b.booking_date, {
        revenue: prev.revenue + b.subtotal,
        commission: prev.commission + b.platform_fee,
      })
    }

    // Fill every calendar day in range so the chart has no gaps
    const chartData: { date: string; revenue: number; commission: number }[] = []
    const cur = new Date(startDate + "T00:00:00Z")
    const last = new Date(endDate + "T00:00:00Z")
    while (cur <= last) {
      const key = cur.toISOString().slice(0, 10)
      chartData.push({ date: key, ...(dayMap.get(key) ?? { revenue: 0, commission: 0 }) })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }

    // The platform fee is charged to the guest on top of the room fee
    // (total = roomFee + platformFee), so the venue keeps the full room fee.
    // It is reported here only so partners can see what the guest paid.
    const totalRevenue = bookings.reduce((s, b) => s + b.subtotal, 0)
    const totalCommission = bookings.reduce((s, b) => s + b.platform_fee, 0)

    // Where the room fee physically sits: deposit bookings leave the remaining
    // share to be collected by the venue at the counter; fully-paid bookings
    // are held by DiNOMAD in full until settlement.
    const heldByPlatform = (b: BookingRow) => roomFeeHeldByPlatform(b)

    const pendingPayout = bookings.reduce((s, b) => s + heldByPlatform(b), 0)
    const collectedAtCounter = bookings.reduce((s, b) => s + (b.subtotal - heldByPlatform(b)), 0)

    return {
      summary: {
        totalRevenue,
        totalCommission,
        totalNet: totalRevenue,
        pendingPayout,
        collectedAtCounter,
      },
      chartData,
      bookings: bookings.map(b => ({
        id: b.id,
        bookingCode: b.booking_code ?? b.id.slice(0, 8).toUpperCase(),
        roomName: b.rooms.name,
        guestName: b.profiles.full_name ?? b.profiles.email,
        date: b.booking_date,
        startTime: this.utcToVietnam(b.start_time),
        endTime: this.utcToVietnam(b.end_time),
        status: b.status,
        paymentStatus: b.payment_status,
        subtotal: b.subtotal,
        platformFee: b.platform_fee,
        net: b.subtotal,
        heldByPlatform: heldByPlatform(b),
        dueAtCounter: b.subtotal - heldByPlatform(b),
        checkedInAt: b.checked_in_at,
      })),
    }
  }

  private utcToVietnam(iso: string): string {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
  }

  private emptyResponse() {
    return {
      summary: {
        totalRevenue: 0,
        totalCommission: 0,
        totalNet: 0,
        pendingPayout: 0,
        collectedAtCounter: 0,
      },
      chartData: [],
      bookings: [],
    }
  }
}
