import { createClient } from "@/utils/supabase/client"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

async function apiFetch<T>(path: string, options?: RequestInit, passedToken?: string): Promise<T> {
  let token = passedToken
  if (!token) {
    const supabase = createClient()
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth session timed out")), 2000),
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
    throw new Error(isAbort ? "Request timed out" : String(err))
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

export interface ApiReview {
  id: string
  roomId: string
  customerId: string
  bookingId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export function getRoomReviews(roomId: string): Promise<ApiReview[]> {
  return apiFetch<ApiReview[]>(`/reviews/room/${roomId}`)
}

export function submitReview(data: {
  roomId: string
  bookingId: string
  rating: number
  comment?: string
}): Promise<ApiReview> {
  return apiFetch<ApiReview>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
