import { createClient } from "@/utils/supabase/client"
import { mapPublicRoom, type PublicRoomRow } from "@/lib/data/public-room"
import type { Room } from "@/lib/types"

const PUBLIC_ROOM_SELECT = `
  id, venue_id, name, description, capacity, price_per_hour,
  category, verified, noise_level, specs,
  venues!inner(name, address, district, lat, lng, status),
  room_amenities(amenity),
  room_vibe_tags(vibe_tag),
  room_images(image_url, sort_order)
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
