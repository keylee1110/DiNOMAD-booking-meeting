import { createClient } from "@/utils/supabase/client"
import type { Supplier } from "@/lib/types"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

export interface SupplierMembership {
  membership: {
    supplierId: string
    role: "owner" | "manager" | "staff"
    isActive: boolean
  }
  supplier: Supplier
}

export interface SupplierApplicationPayload {
  legalName: string
  displayName: string
  taxCode?: string
  businessEmail?: string
  businessPhone?: string
  onboardingNote?: string
}

async function authedFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Not authenticated")

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.error?.message ?? body?.message
    const readable = Array.isArray(msg) ? msg.join(", ") : (msg ?? `Request failed: ${res.status}`)
    throw new Error(readable)
  }

  const json = await res.json()
  return (json.data ?? json) as T
}

/** All supplier memberships of the current user (empty array = no application yet). */
export function getMySupplierMemberships(): Promise<SupplierMembership[]> {
  return authedFetch<SupplierMembership[]>("/suppliers/me")
}

/** Submit a partner application. Backend rejects duplicates with 400. */
export function submitSupplierApplication(payload: SupplierApplicationPayload): Promise<Supplier> {
  return authedFetch<Supplier>("/suppliers/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
