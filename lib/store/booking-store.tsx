"use client"

import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react"
import type { BookingFlowState, Room, TimeSlot, PaymentMethod, Booking } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"
import { toggleWishlist as apiToggleWishlist, getWishlist as apiGetWishlist } from "@/lib/api/wishlist"
import { buildCheckInQrPayload } from "@/lib/booking/check-in"

const initialState: BookingFlowState = {
  selectedRoom: null,
  selectedDate: "",
  selectedSlots: [],
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  paymentMethod: "vietqr",
  totalPrice: 0,
  roomFee: 0,
  platformFee: 0,
  bookingId: null,
}

type BookingAction =
  | { type: "SET_ROOM"; room: Room }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_SLOTS"; slots: TimeSlot[] }
  | { type: "SET_GUEST_INFO"; name: string; phone: string; email: string }
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod }
  | { type: "CALCULATE_PRICE" }
  | { type: "SET_BOOKING_ID"; id: string }
  | { type: "SET_CONFIRMED_BOOKING"; booking: Booking }
  | { type: "RESET" }

function bookingReducer(state: BookingFlowState, action: BookingAction): BookingFlowState {
  switch (action.type) {
    case "SET_ROOM":
      return { ...state, selectedRoom: action.room }
    case "SET_DATE":
      return { ...state, selectedDate: action.date, selectedSlots: [] }
    case "SET_SLOTS":
      return { ...state, selectedSlots: action.slots }
    case "SET_GUEST_INFO":
      return { ...state, guestName: action.name, guestPhone: action.phone, guestEmail: action.email }
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method }
    case "CALCULATE_PRICE": {
      const hours = state.selectedSlots.length
      const roomFee = state.selectedRoom ? state.selectedRoom.pricePerHour * hours : 0
      const platformFee = Math.round(roomFee * 0.1)
      return { ...state, roomFee, platformFee, totalPrice: roomFee + platformFee }
    }
    case "SET_BOOKING_ID":
      return { ...state, bookingId: action.id }
    case "SET_CONFIRMED_BOOKING":
      return { ...state, confirmedBooking: action.booking }
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface BookingContextType {
  state: BookingFlowState
  dispatch: React.Dispatch<BookingAction>
  myBookings: Booking[]
  addBooking: (booking: Booking) => void
  refreshBookings: () => void
  wishlist: string[]
  toggleWishlist: (roomId: string) => Promise<void>
}

const BookingContext = createContext<BookingContextType | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const supabase = createClient()

  const refreshBookings = async () => {
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch (e) {
      console.warn("Could not get supabase user:", e)
    }

    if (user) {
      // Logged-in user: Fetch from Supabase
      try {
        const { data: dbBookings, error } = await supabase
          .from("bookings")
          .select(`
            *,
            rooms!inner(
              name,
              venues!inner(name, address)
            )
          `)
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        if (dbBookings) {
          const mappedBookings: Booking[] = dbBookings.map((b: any) => {
            const start = new Date(b.start_time)
            const end = new Date(b.end_time)
            const pad = (n: number) => n.toString().padStart(2, '0')
            const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`
            const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`

            return {
              id: b.id,
              roomId: b.room_id,
              roomName: b.rooms?.name || "Room",
              venueName: b.rooms?.venues?.name || "Venue",
              venueAddress: b.rooms?.venues?.address || "",
              date: b.booking_date,
              startTime,
              endTime,
              duration: Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))),
              guestName: user.user_metadata?.full_name || user.email || "Guest",
              guestPhone: user.user_metadata?.phone || "",
              guestEmail: user.email,
              totalPrice: b.total_amount,
              roomFee: b.subtotal,
              platformFee: b.platform_fee,
              status: b.status,
              paymentMethod: "vietqr",
              checkInQr: buildCheckInQrPayload(b.id, b.qr_code_token || ""),
              accessCode: b.qr_code_token || undefined,
              wifiPassword: `${b.room_id}-wifi-${b.id.slice(-3)}`,
              createdAt: b.created_at,
              paidAmount: b.payment_status === "deposited"
                ? Math.max(0, Math.round(b.subtotal * 0.2 + b.platform_fee) - b.points_redeemed)
                : b.total_amount,
              paymentStatus: b.payment_status || "fully_paid",
              bookingCode: b.booking_code,
              pointsRedeemed: b.points_redeemed,
              pointsEarned: b.points_earned
            }
          })
          setMyBookings(mappedBookings)
        }
      } catch (err) {
        console.warn("Failed to fetch bookings from Supabase, falling back to localStorage:", err)
        loadLocalBookings()
      }
    } else {
      // Guest: Load from localStorage
      loadLocalBookings()
    }
  }

  const loadLocalBookings = () => {
    if (typeof window !== "undefined") {
      const saved: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
      const uniqueBookings = saved.filter(
        (booking, index, self) => index === self.findIndex((b) => b.id === booking.id)
      )
      if (uniqueBookings.length !== saved.length) {
        localStorage.setItem("dinomad_bookings", JSON.stringify(uniqueBookings))
      }
      setMyBookings(uniqueBookings)
    }
  }

  const addBooking = (booking: Booking) => {
    setMyBookings((prev) => {
      if (!prev.some((b) => b.id === booking.id)) {
        return [booking, ...prev]
      }
      return prev
    })

    if (typeof window !== "undefined") {
      // Write to localStorage ONLY if guest (not logged in)
      supabase.auth.getUser().then(({ data }) => {
        if (!data?.user) {
          const existing: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
          if (!existing.some((b) => b.id === booking.id)) {
            const updated = [booking, ...existing]
            localStorage.setItem("dinomad_bookings", JSON.stringify(updated))
          }
        }
      })
    }
  }

  const toggleWishlist = async (roomId: string) => {
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch (e) {
      console.warn("Could not get supabase user, assuming guest:", e)
    }

    let updated: string[] = []
    const isFav = wishlist.includes(roomId)
    if (isFav) {
      updated = wishlist.filter(id => id !== roomId)
    } else {
      updated = [...wishlist, roomId]
    }

    // Proactively update state first for instant UI response (no lag!)
    setWishlist(updated)

    if (user) {
      try {
        const result = await apiToggleWishlist(roomId)
        if (!result.favorited === isFav) {
          setWishlist(result.favorited ? [...wishlist, roomId] : wishlist.filter((id) => id !== roomId))
        }
      } catch (err) {
        console.warn("Failed to sync wishlist to backend API, falling back to localStorage:", err)
        localStorage.setItem("dinomad_wishlist", JSON.stringify(updated))
      }
    } else {
      localStorage.setItem("dinomad_wishlist", JSON.stringify(updated))
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshBookings()
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("dinomad_wishlist")
        if (saved) {
          try {
            setWishlist(JSON.parse(saved))
          } catch (e) {
            console.error(e)
          }
        }
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Sync wishlist and bookings with database on auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Trigger a bookings list refresh
      refreshBookings()

      if (session?.user) {
        try {
          const data = await apiGetWishlist()
          setWishlist(data.map(item => item.room_id))
          return
        } catch (e) {
          console.warn("Failed to fetch wishlist from backend API, loading from localStorage:", e)
        }
      }
      
      // Guest fallback
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("dinomad_wishlist")
        setWishlist(saved ? JSON.parse(saved) : [])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BookingContext.Provider value={{ state, dispatch, myBookings, addBooking, refreshBookings, wishlist, toggleWishlist }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used within BookingProvider")
  return ctx
}
