import { createClient } from "@/utils/supabase/client"
import type { Supplier, SupplierStatus } from "@/lib/types"

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

const DEMO_KEY = "dinomad_demo_suppliers"

function getDemoSuppliers(): Supplier[] {
  if (typeof window === "undefined") return []
  const saved = localStorage.getItem(DEMO_KEY)
  if (saved) return JSON.parse(saved)
  const defaults: Supplier[] = [
    { id: "demo-1", legalName: "Huong Giang Workspace", displayName: "Huong Giang Workspace", taxCode: null, businessEmail: "giang@huonggiang.vn", businessPhone: "0901111111", status: "pending", onboardingNote: null, approvedAt: null, approvedBy: null, createdAt: "2026-06-10T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z" },
    { id: "demo-2", legalName: "Tech Hub BThanh", displayName: "Tech Hub BThanh", taxCode: null, businessEmail: "minh@techhub.vn", businessPhone: "0902222222", status: "pending", onboardingNote: null, approvedAt: null, approvedBy: null, createdAt: "2026-06-11T00:00:00Z", updatedAt: "2026-06-11T00:00:00Z" },
    { id: "demo-3", legalName: "The Coffee Lab", displayName: "The Coffee Lab", taxCode: "TX001", businessEmail: "thanh@coffeelab.vn", businessPhone: "0903333333", status: "approved", onboardingNote: null, approvedAt: "2026-05-01T00:00:00Z", approvedBy: "admin", createdAt: "2026-04-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    { id: "demo-4", legalName: "Workspace Saigon", displayName: "Workspace Saigon", taxCode: "TX002", businessEmail: "khoa@workspace.vn", businessPhone: "0904444444", status: "approved", onboardingNote: null, approvedAt: "2026-05-15T00:00:00Z", approvedBy: "admin", createdAt: "2026-04-15T00:00:00Z", updatedAt: "2026-05-15T00:00:00Z" },
    { id: "demo-5", legalName: "BookCafe Central", displayName: "BookCafe Central", taxCode: null, businessEmail: "hoa@bookcafe.vn", businessPhone: null, status: "rejected", onboardingNote: "Missing business documents", approvedAt: null, approvedBy: null, createdAt: "2026-06-05T00:00:00Z", updatedAt: "2026-06-06T00:00:00Z" },
  ]
  localStorage.setItem(DEMO_KEY, JSON.stringify(defaults))
  return defaults
}

function saveDemoSuppliers(suppliers: Supplier[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_KEY, JSON.stringify(suppliers))
  }
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return !!data.session
  } catch {
    return false
  }
}

export async function getSuppliers(): Promise<Supplier[]> {
  if (!(await isAuthenticated())) return getDemoSuppliers()
  try {
    return await apiFetch<Supplier[]>("/suppliers")
  } catch {
    return getDemoSuppliers()
  }
}

export async function getSupplierById(id: string): Promise<Supplier> {
  if (!(await isAuthenticated())) {
    const list = getDemoSuppliers()
    const found = list.find((s) => s.id === id)
    if (!found) throw new Error("Supplier not found")
    return found
  }
  try {
    return await apiFetch<Supplier>(`/suppliers/${id}`)
  } catch {
    const list = getDemoSuppliers()
    const found = list.find((s) => s.id === id)
    if (!found) throw new Error("Supplier not found")
    return found
  }
}

export async function approveSupplier(id: string): Promise<Supplier> {
  if (!(await isAuthenticated())) {
    const list = getDemoSuppliers()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error("Supplier not found")
    list[idx] = { ...list[idx], status: "approved", approvedAt: new Date().toISOString(), approvedBy: "admin" }
    saveDemoSuppliers(list)
    return list[idx]
  }
  try {
    return await apiFetch<Supplier>(`/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    })
  } catch {
    const list = getDemoSuppliers()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error("Supplier not found")
    list[idx] = { ...list[idx], status: "approved", approvedAt: new Date().toISOString(), approvedBy: "admin" }
    saveDemoSuppliers(list)
    return list[idx]
  }
}

export async function rejectSupplier(id: string): Promise<Supplier> {
  if (!(await isAuthenticated())) {
    const list = getDemoSuppliers()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error("Supplier not found")
    list[idx] = { ...list[idx], status: "rejected" }
    saveDemoSuppliers(list)
    return list[idx]
  }
  try {
    return await apiFetch<Supplier>(`/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    })
  } catch {
    const list = getDemoSuppliers()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error("Supplier not found")
    list[idx] = { ...list[idx], status: "rejected" }
    saveDemoSuppliers(list)
    return list[idx]
  }
}

export type { SupplierStatus }
