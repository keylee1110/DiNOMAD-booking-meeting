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

export async function getPublicRooms(): Promise<Room[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("rooms")
    .select(PUBLIC_ROOM_SELECT)
    .eq("status", "published")
    .eq("venues.status", "published")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as PublicRoomRow[]).map(mapPublicRoom)
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
