import { createClient } from "@/utils/supabase/client"
import type { Amenity, VibeTag } from "@/lib/types"

export async function uploadRoomImage(file: File, roomId: string): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Not authenticated — please sign in before uploading images")
  const userId = session.user.id
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  // Path: rooms/{userId}/{roomId}/{filename}  — matches Storage RLS ownership check
  const path = `rooms/${userId}/${roomId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from("room-images")
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from("room-images")
    .getPublicUrl(data.path)

  return publicUrl
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

async function apiFetch<T>(path: string, options?: RequestInit, passedToken?: string): Promise<T> {
  let token = passedToken
  if (!token) {
    const supabase = createClient()

    // Timeout getSession() so a stale refresh token never blocks the UI forever
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth session timed out — please sign in again")), 2000),
      ),
    ])
    token = sessionResult.data.session?.access_token
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const isAbort = err instanceof DOMException && err.name === "AbortError"
    throw new Error(isAbort ? "Request timed out — backend may be unreachable" : String(err))
  }
  clearTimeout(timeoutId)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // NestJS class-validator returns message as string[] inside error.message
    const msg = body?.error?.message ?? body?.message
    const readable = Array.isArray(msg) ? msg.join(", ") : (msg ?? `Request failed: ${res.status}`)
    console.error("API error:", res.status, body)
    throw new Error(readable)
  }

  const json = await res.json()
  return json.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiRoomImage {
  id: string
  imageUrl: string
  sortOrder: number
}

export interface ApiRoom {
  id: string
  venueId: string
  name: string
  description: string
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  status: string
  verified: boolean
  noiseLevel: number | null
  specs: Record<string, string>
  amenities: Amenity[]
  vibeTags: VibeTag[]
  images: ApiRoomImage[]
  createdAt: string
  updatedAt: string
}

export interface ApiVenue {
  id: string
  supplierId: string
  name: string
  description: string | null
  address: string
  district: string
  city: string
  lat: number | null
  lng: number | null
  phone: string | null
  imageUrl: string | null
  status: string
  openTime: string   // "07:00"
  closeTime: string  // "22:00"
  createdAt: string
  updatedAt: string
  rooms: ApiRoom[]
}

export interface CreateVenuePayload {
  name: string
  description?: string
  address: string
  district: string
  city?: string
  phone?: string
  lat?: number
  lng?: number
}

export interface CreateRoomPayload {
  name: string
  description: string
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  amenities?: string[]
  vibeTags?: string[]
  specs?: Record<string, string>
  noiseLevel?: number
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {}
export interface UpdateVenuePayload extends Partial<CreateVenuePayload> {
  openTime?: string
  closeTime?: string
}

export interface ApiSlot {
  id: string          // UUID for blocked slots, "virtual-HH:MM" for available slots
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  status: "available" | "blocked" | "booked"
  available: boolean
  heldUntil: string | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export function getPartnerVenues(): Promise<ApiVenue[]> {
  return apiFetch<ApiVenue[]>("/partner/venues")
}

export function createVenue(dto: CreateVenuePayload): Promise<ApiVenue> {
  return apiFetch<ApiVenue>("/partner/venues", {
    method: "POST",
    body: JSON.stringify(dto),
  })
}

export function updateVenue(venueId: string, dto: UpdateVenuePayload): Promise<ApiVenue> {
  return apiFetch<ApiVenue>(`/partner/venues/${venueId}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  })
}

export function updateVenueStatus(
  venueId: string,
  status: "published" | "draft" | "suspended",
): Promise<ApiVenue> {
  return apiFetch<ApiVenue>(`/partner/venues/${venueId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function createRoom(venueId: string, dto: CreateRoomPayload): Promise<ApiRoom> {
  return apiFetch<ApiRoom>(`/partner/venues/${venueId}/rooms`, {
    method: "POST",
    body: JSON.stringify(dto),
  })
}

export function updateRoom(roomId: string, dto: UpdateRoomPayload): Promise<ApiRoom> {
  return apiFetch<ApiRoom>(`/partner/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  })
}

export function updateRoomStatus(
  roomId: string,
  status: "published" | "unavailable" | "archived",
): Promise<ApiRoom> {
  return apiFetch<ApiRoom>(`/partner/rooms/${roomId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function deleteRoom(roomId: string): Promise<void> {
  return apiFetch<void>(`/partner/rooms/${roomId}`, { method: "DELETE" })
}

export function getRoomSlots(roomId: string, date: string): Promise<ApiSlot[]> {
  return apiFetch<ApiSlot[]>(`/partner/rooms/${roomId}/slots?date=${date}`)
}

export function saveRoomImages(
  roomId: string,
  urls: string[],
): Promise<{ saved: number }> {
  return apiFetch(`/partner/rooms/${roomId}/images`, {
    method: "POST",
    body: JSON.stringify({ urls }),
  })
}

export function deleteRoomImage(
  roomId: string,
  imageId: string,
): Promise<{ deleted: boolean }> {
  return apiFetch(`/partner/rooms/${roomId}/images/${imageId}`, {
    method: "DELETE",
  })
}

export function updateSlotStatuses(
  roomId: string,
  date: string,
  startTimes: string[],
  status: "available" | "blocked",
): Promise<{ updated: number }> {
  return apiFetch(`/partner/rooms/${roomId}/slots`, {
    method: "PATCH",
    body: JSON.stringify({ date, startTimes, status }),
  })
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningsSummary {
  totalRevenue: number
  totalCommission: number
  totalNet: number
  pendingPayout: number
}

export interface EarningsChartDay {
  date: string      // YYYY-MM-DD
  revenue: number
  commission: number
}

export interface EarningsBookingRow {
  id: string
  bookingCode: string
  roomName: string
  guestName: string
  date: string
  startTime: string
  endTime: string
  status: string
  subtotal: number
  platformFee: number
  net: number
  checkedInAt: string | null
}

export interface EarningsResponse {
  summary: EarningsSummary
  chartData: EarningsChartDay[]
  bookings: EarningsBookingRow[]
}

export function getPartnerEarnings(startDate?: string, endDate?: string): Promise<EarningsResponse> {
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)
  const qs = params.toString()
  return apiFetch<EarningsResponse>(`/partner/earnings${qs ? `?${qs}` : ""}`)
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

export interface ScannerBooking {
  id: string
  bookingCode: string
  date: string
  startTime: string
  endTime: string
  status: string
  checkedInAt: string | null
  roomName: string
  venueName: string
  guestName: string
  guestPhone: string | null
  subtotal: number
  platformFee: number
}

export function scannerLookup(bookingCode: string): Promise<ScannerBooking> {
  return apiFetch<ScannerBooking>(
    `/partner/scanner/lookup?bookingCode=${encodeURIComponent(bookingCode)}`,
  )
}

export function scannerCheckIn(bookingId: string): Promise<ScannerBooking> {
  return apiFetch<ScannerBooking>(`/partner/scanner/${bookingId}/checkin`, { method: "PATCH" })
}

export function scannerNoShow(bookingId: string): Promise<ScannerBooking> {
  return apiFetch<ScannerBooking>(`/partner/scanner/${bookingId}/no-show`, { method: "PATCH" })
}

export function scannerCheckOut(bookingId: string): Promise<ScannerBooking> {
  return apiFetch<ScannerBooking>(`/partner/scanner/${bookingId}/checkout`, { method: "PATCH" })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  checkInsToday: number
  bookingsToday: number
  revenueToday: number
  activeWalkIns: number
}

export interface DashboardPendingCheckIn {
  id: string
  bookingCode: string
  guestName: string
  roomName: string
  startTime: string
  endTime: string
  status: string
}

export interface DashboardActivityItem {
  id: string
  type: "check-in" | "check-out" | "booking" | "no-show" | "system"
  roomName: string
  bookingCode: string
  date: string
}

export interface DashboardRevenuePoint {
  date: string
  revenue: number
}

export interface DashboardResponse {
  metrics: DashboardMetrics
  pendingCheckIns: DashboardPendingCheckIn[]
  activityFeed: DashboardActivityItem[]
  revenueChart: DashboardRevenuePoint[]
}

export function getPartnerDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/partner/dashboard")
}

// ─── Partner Bookings ─────────────────────────────────────────────────────────

export interface PartnerBooking {
  id: string
  bookingCode: string
  date: string
  startTime: string
  endTime: string
  status: string
  checkedInAt: string | null
  roomName: string
  guestName: string
  subtotal: number
  platformFee: number
}

export function getPartnerBookings(date: string, status?: string): Promise<PartnerBooking[]> {
  const params = new URLSearchParams({ date })
  if (status && status !== "all") params.set("status", status)
  return apiFetch<PartnerBooking[]>(`/partner/bookings?${params.toString()}`)
}

export function updatePartnerBookingStatus(
  bookingId: string,
  status: string,
): Promise<{ id: string; status: string; updated: boolean }> {
  return apiFetch(`/partner/bookings/${bookingId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}
