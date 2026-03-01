"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { BookingFlowState, Room, TimeSlot, PaymentMethod } from "@/lib/types"

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
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface BookingContextType {
  state: BookingFlowState
  dispatch: React.Dispatch<BookingAction>
}

const BookingContext = createContext<BookingContextType | null>(null)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error("useBooking must be used within BookingProvider")
  return ctx
}
