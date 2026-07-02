import { createClient } from "@/utils/supabase/client"
import { mapPublicRoom, type PublicRoomRow } from "@/lib/data/public-room"
import type { Room, TimeSlot } from "@/lib/types"

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

interface ApiSlot {
  id: string
  startTime: string
  endTime: string
  status: "available" | "blocked" | "booked" | "past"
  available: boolean
  heldUntil: string | null
}

const PUBLIC_ROOM_SELECT = `
  id, venue_id, name, description, capacity, price_per_hour,
  category, verified, noise_level, specs,
  venues!inner(name, address, district, lat, lng, status),
  room_amenities(amenity),
  room_vibe_tags(vibe_tag),
  room_images(image_url, sort_order),
  reviews(rating)
`

// Simple in-memory cache (session-scoped, avoids duplicate fetches during navigation)
let cachedRooms: Room[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000 // 1 minute

export async function getPublicRooms(): Promise<Room[]> {
  const now = Date.now()
  if (cachedRooms && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRooms
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("rooms")
    .select(PUBLIC_ROOM_SELECT)
    .eq("status", "published")
    .eq("venues.status", "published")
    .order("created_at", { ascending: false })
    .limit(50) // cap total results

  if (error) throw new Error(error.message)
  const rooms = ((data ?? []) as unknown as PublicRoomRow[]).map(mapPublicRoom)
  cachedRooms = rooms
  cacheTimestamp = now
  return rooms
}

/** Optimized query for landing page: fetches fewer rooms with same joins */
export async function getFeaturedRooms(limit = 8): Promise<Room[]> {
  const all = await getPublicRooms()
  return all.slice(0, limit)
}

export async function getPublicRoomById(id: string): Promise<Room | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("rooms")
    .select(PUBLIC_ROOM_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .eq("venues.status", "published")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapPublicRoom(data as unknown as PublicRoomRow) : null
}

/** Real slot availability for a room — reflects actual bookings/blocks, not mock data. */
export async function getRoomAvailability(roomId: string, date: string): Promise<TimeSlot[]> {
  const res = await fetch(`${BACKEND_BASE}/rooms/${roomId}/slots?date=${date}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? body?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  const slots = (json.data ?? json) as ApiSlot[]
  return slots.map(s => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    available: s.available,
    price: 0,
    isPast: s.status === "past",
  }))
}
