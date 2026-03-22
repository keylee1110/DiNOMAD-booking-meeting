"use client"

import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react"
import type { BookingFlowState, Room, TimeSlot, PaymentMethod, Booking } from "@/lib/types"

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
      const hours = state.selectedSlots.length * 0.5
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
}

const BookingContext = createContext<BookingContextType | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)
  const [myBookings, setMyBookings] = useState<Booking[]>([])

  const refreshBookings = () => {
    if (typeof window !== "undefined") {
      const saved: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
      // Lọc bỏ các phần tử trùng ID
      const uniqueBookings = saved.filter(
        (booking, index, self) => index === self.findIndex((b) => b.id === booking.id)
      )
      
      // Nếu có sự khác biệt (tức là có trùng lặp), cập nhật lại localStorage cho sạch
      if (uniqueBookings.length !== saved.length) {
        localStorage.setItem("dinomad_bookings", JSON.stringify(uniqueBookings))
      }
      
      setMyBookings(uniqueBookings)
    }
  }

  const addBooking = (booking: Booking) => {
    if (typeof window !== "undefined") {
      const existing: Booking[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
      // Kiểm tra trùng lặp ID
      if (!existing.some(b => b.id === booking.id)) {
        const updated = [booking, ...existing]
        localStorage.setItem("dinomad_bookings", JSON.stringify(updated))
        setMyBookings(updated)
      }
    }
  }

  useEffect(() => {
    refreshBookings()
  }, [])

  return (
    <BookingContext.Provider value={{ state, dispatch, myBookings, addBooking, refreshBookings }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used within BookingProvider")
  return ctx
}
