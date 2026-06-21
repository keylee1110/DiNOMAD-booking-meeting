import { createClient } from "@/utils/supabase/client"

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000/api"

export interface CreateBookingPayload {
  roomId: string
  date: string          // YYYY-MM-DD
  startTime: string     // "HH:MM"
  endTime: string       // "HH:MM"
  paymentMode: "deposit" | "full"
  paymentMethod: "vietqr" | "momo" | "zalopay" | "card"
  redeemPoints?: boolean
}

export interface CreatedBooking {
  id: string
  bookingCode: string
  date: string
  startTime: string
  endTime: string
  status: string
  subtotal: number
  platformFee: number
  totalAmount: number
  pointsRedeemed: number
  pointsEarned: number
  amountPaidNow: number
  paymentStatus: "deposited" | "fully_paid"
  qrCodeToken: string | null
  createdAt: string
}

/**
 * Create a booking via the backend. The server recomputes all amounts and points
 * (the client only sends intent), writes the booking + payment, and returns the
 * canonical record. Requires an authenticated session.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<CreatedBooking> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error("Not authenticated")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  let res: Response
  try {
    res = await fetch(`${BASE}/bookings`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
  return json.data as CreatedBooking
}
