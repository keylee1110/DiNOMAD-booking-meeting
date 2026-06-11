import { createClient } from "@/utils/supabase/client"
import type { Amenity, VibeTag } from "@/lib/types"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`)
  }

  const json = await res.json()
  return json.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiRoom {
  id: string
  venueId: string
  name: string
  nameVi: string | null
  description: string
  descriptionVi: string | null
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  status: string
  verified: boolean
  noiseLevel: number | null
  specs: Record<string, string>
  specsVi: Record<string, string>
  amenities: Amenity[]
  vibeTags: VibeTag[]
  createdAt: string
  updatedAt: string
}

export interface ApiVenue {
  id: string
  supplierId: string
  name: string
  nameVi: string | null
  description: string | null
  address: string
  district: string
  city: string
  lat: number | null
  lng: number | null
  phone: string | null
  imageUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  rooms: ApiRoom[]
}

export interface CreateVenuePayload {
  name: string
  nameVi?: string
  description?: string
  address: string
  addressVi?: string
  district: string
  city?: string
  phone?: string
  lat?: number
  lng?: number
}

export interface CreateRoomPayload {
  name: string
  nameVi?: string
  description: string
  descriptionVi?: string
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  amenities?: string[]
  vibeTags?: string[]
  specs?: Record<string, string>
  noiseLevel?: number
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {}
export interface UpdateVenuePayload extends Partial<CreateVenuePayload> {}

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
