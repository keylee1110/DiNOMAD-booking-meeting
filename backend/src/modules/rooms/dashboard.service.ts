import { Injectable } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"
import { VenuesService } from "./venues.service"

@Injectable()
export class DashboardService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly venuesService: VenuesService,
  ) {}

  async getDashboard(userId: string) {
    const supplierId = await this.venuesService.getSupplierIdForUser(userId)

    // Step 1: venue IDs for this supplier
    const { data: venueRows } = await this.supabase.admin
      .from("venues")
      .select("id")
      .eq("supplier_id", supplierId)
    const venueIds = (venueRows ?? []).map(v => v.id as string)

    if (venueIds.length === 0) return this.emptyResponse()

    // Step 2: room IDs
    const { data: roomRows } = await this.supabase.admin
      .from("rooms")
      .select("id")
      .in("venue_id", venueIds)
      .neq("status", "archived")
    const roomIds = (roomRows ?? []).map(r => r.id as string)

    if (roomIds.length === 0) return this.emptyResponse()

    const today = new Date().toISOString().slice(0, 10)

    // Step 3: today's bookings
    const { data: todayBookings } = await this.supabase.admin
      .from("bookings")
      .select("id, booking_code, booking_date, start_time, end_time, status, checked_in_at, subtotal, platform_fee, room_id, customer_id, rooms(name), profiles(full_name, email)")
      .in("room_id", roomIds)
      .eq("booking_date", today)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })

    const bookings = (todayBookings ?? []) as any[]

    // Step 4: last 7 days revenue chart
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const chartStart = sevenDaysAgo.toISOString().slice(0, 10)

    const { data: chartBookings } = await this.supabase.admin
      .from("bookings")
      .select("booking_date, subtotal")
      .in("room_id", roomIds)
      .gte("booking_date", chartStart)
      .lte("booking_date", today)
      .neq("status", "cancelled")

    // Build chart data (fill gaps)
    const dayMap = new Map<string, number>()
    for (const b of (chartBookings ?? [])) {
      dayMap.set(b.booking_date, (dayMap.get(b.booking_date) ?? 0) + b.subtotal)
    }
    const revenueChart: { date: string; revenue: number }[] = []
    const cur = new Date(chartStart + "T00:00:00Z")
    const last = new Date(today + "T00:00:00Z")
    while (cur <= last) {
      const key = cur.toISOString().slice(0, 10)
      revenueChart.push({ date: key, revenue: dayMap.get(key) ?? 0 })
      cur.setUTCDate(cur.getUTCDate() + 1)
    }

    // Metrics
    const checkInsToday = bookings.filter(b => b.status === "checked_in").length
    const bookingsToday = bookings.length
    const revenueToday = bookings
      .filter(b => b.status === "confirmed" || b.status === "checked_in" || b.status === "completed")
      .reduce((s, b) => s + b.subtotal, 0)

    // Pending check-ins: confirmed but not yet checked in
    const pendingCheckIns = bookings
      .filter(b => b.status === "confirmed" && !b.checked_in_at)
      .map(b => ({
        id: b.id,
        bookingCode: b.booking_code ?? b.id.slice(0, 8).toUpperCase(),
        guestName: b.profiles?.full_name ?? b.profiles?.email ?? "Guest",
        roomName: b.rooms?.name ?? "Room",
        startTime: this.utcToVietnam(b.start_time),
        endTime: this.utcToVietnam(b.end_time),
        status: b.status,
      }))

    // Activity feed: last 6 events
    const { data: recentActivity } = await this.supabase.admin
      .from("bookings")
      .select("id, booking_code, status, checked_in_at, booking_date, rooms(name)")
      .in("room_id", roomIds)
      .in("status", ["checked_in", "completed", "confirmed", "no_show"])
      .order("updated_at", { ascending: false })
      .limit(6)

    const activityFeed = (recentActivity ?? []).map((b: any) => ({
      id: b.id,
      type: b.status === "checked_in" ? "check-in" : b.status === "completed" ? "check-out" : b.status === "no_show" ? "no-show" : "booking",
      roomName: b.rooms?.name ?? "Room",
      bookingCode: b.booking_code ?? b.id.slice(0, 8).toUpperCase(),
      date: b.booking_date,
    }))

    return {
      metrics: {
        checkInsToday,
        bookingsToday,
        revenueToday,
        activeWalkIns: 0,
      },
      pendingCheckIns,
      activityFeed,
      revenueChart,
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
      metrics: { checkInsToday: 0, bookingsToday: 0, revenueToday: 0, activeWalkIns: 0 },
      pendingCheckIns: [],
      activityFeed: [],
      revenueChart: [],
    }
  }
}
