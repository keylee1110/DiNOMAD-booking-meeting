import { apiFetch } from "@/lib/api"
import { searchRooms as mockSearchRooms, getRoomById as mockGetRoomById } from "@/lib/data/rooms"
import type { Room } from "@/lib/types"

export interface RoomSearchResult {
  rooms: Room[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RoomSearchParams {
  query?: string
  district?: string
  minCapacity?: number
  maxPrice?: number
  amenities?: string[]
  vibeTags?: string[]
  category?: string
  verified?: boolean
  noiseLevelMin?: number
  page?: number
  pageSize?: number
}

function buildSearchParams(params: RoomSearchParams): string {
  const sp = new URLSearchParams()
  if (params.query) sp.set("query", params.query)
  if (params.district) sp.set("district", params.district)
  if (params.minCapacity) sp.set("minCapacity", String(params.minCapacity))
  if (params.maxPrice) sp.set("maxPrice", String(params.maxPrice))
  if (params.amenities?.length) sp.set("amenities", params.amenities.join(","))
  if (params.vibeTags?.length) sp.set("vibeTags", params.vibeTags.join(","))
  if (params.category) sp.set("category", params.category)
  if (params.verified) sp.set("verified", "true")
  if (params.noiseLevelMin) sp.set("noiseLevelMin", String(params.noiseLevelMin))
  if (params.page) sp.set("page", String(params.page))
  if (params.pageSize) sp.set("pageSize", String(params.pageSize))
  return sp.toString()
}

export async function searchRoomsApi(
  params: RoomSearchParams,
  locale?: string,
): Promise<RoomSearchResult> {
  try {
    const qs = buildSearchParams(params)
    const result = await apiFetch<RoomSearchResult>(`/rooms${qs ? `?${qs}` : ""}`)
    return result
  } catch {
    const mockResult = mockSearchRooms(
      {
        district: params.district,
        minCapacity: params.minCapacity,
        maxPrice: params.maxPrice,
        amenities: params.amenities,
        vibeTags: params.vibeTags,
        query: params.query,
        category: params.category,
        verified: params.verified,
        noiseLevelMin: params.noiseLevelMin,
        page: params.page,
        pageSize: params.pageSize,
      },
      locale,
    )
    return mockResult
  }
}

export async function getRoomByIdApi(id: string, locale?: string): Promise<Room | null> {
  try {
    return await apiFetch<Room>(`/rooms/${id}`)
  } catch {
    return mockGetRoomById(id, locale) ?? null
  }
}
