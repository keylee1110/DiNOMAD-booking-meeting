import { createClient } from "@/utils/supabase/client"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const supabase = createClient()
  const sessionResult = await Promise.race([
    supabase.auth.getSession(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth session timed out")), 10000),
    ),
  ])
  const token = sessionResult.data.session?.access_token

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

export function toggleWishlist(roomId: string): Promise<{ favorited: boolean }> {
  return apiFetch<{ favorited: boolean }>("/wishlists/toggle", {
    method: "POST",
    body: JSON.stringify({ roomId }),
  })
}

export function getWishlist(): Promise<{ room_id: string }[]> {
  return apiFetch<{ room_id: string }[]>("/wishlists")
}
