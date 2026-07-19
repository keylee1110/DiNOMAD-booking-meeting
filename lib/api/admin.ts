import { createClient } from "@/utils/supabase/client"
import type { AdminBooking, AdminRoom, AdminUser, Supplier, SupplierStatus } from "@/lib/types"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

async function apiFetch<T>(path: string, options?: RequestInit, passedToken?: string): Promise<T> {
  let token = passedToken
  if (!token) {
    const supabase = createClient()

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
    const msg = body?.error?.message ?? body?.message
    const readable = Array.isArray(msg) ? msg.join(", ") : (msg ?? `Request failed: ${res.status}`)
    throw new Error(readable)
  }

  const json = await res.json()
  return (json.data ?? json) as T
}

// --- ADMIN API ENDPOINTS ---

/** Lấy toàn bộ danh sách suppliers (admin only) */
export async function getSuppliers(): Promise<Supplier[]> {
  return apiFetch<Supplier[]>("/suppliers")
}

/** Lấy supplier theo ID */
export async function getSupplierById(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`)
}

/** Duyệt supplier — PATCH status → "approved" */
export async function approveSupplier(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "approved" }),
  })
}

/** Từ chối supplier — PATCH status → "rejected" */
export async function rejectSupplier(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "rejected" }),
  })
}

export const getAdminBookings = () => apiFetch<AdminBooking[]>("/bookings/admin/all")
export const getAdminUsers = () => apiFetch<AdminUser[]>("/users")
export const getAdminRooms = () => apiFetch<AdminRoom[]>("/partner/rooms/admin/all")
export const setAdminRoomStatus = (id: string, status: AdminRoom["status"]) =>
  apiFetch<AdminRoom>(`/partner/rooms/admin/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
export const archiveAdminRoom = (id: string) =>
  apiFetch<{ success: boolean }>(`/partner/rooms/admin/${id}`, { method: "DELETE" })

export type { SupplierStatus }
