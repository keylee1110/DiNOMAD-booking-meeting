export type Locale = "en" | "vi"

export type Amenity =
  | "wifi"
  | "tv"
  | "whiteboard"
  | "ac"
  | "hdmi"
  | "projector"
  | "power_outlets"
  | "coffee"
  | "water"
  | "parking"
  | "printing"

export type VibeTag =
  | "ultra_quiet"
  | "discussion_friendly"
  | "cold_ac"
  | "natural_light"
  | "cozy"
  | "modern"
  | "rooftop"
  | "garden_view"

export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled" | "checked_in"

export type PaymentMethod = "vietqr" | "momo" | "zalopay" | "card"

export interface Venue {
  id: string
  name: string
  address: string
  district: string
  city: string
  lat: number
  lng: number
  phone: string
  partnerId: string
  imageUrl: string
}

export interface Room {
  id: string
  venueId: string
  venueName: string
  name: string
  description: string
  district: string
  address: string
  capacity: number
  pricePerHour: number
  amenities: Amenity[]
  vibeTags: VibeTag[]
  images: string[]
  rating: number
  reviewCount: number
  verified: boolean
  slotsLeftToday: number
  noiseLevel?: number
  lat: number
  lng: number
  specs: {
    tvModel?: string
    hdmiVersion?: string
    whiteboardType?: string
    wifiSpeed?: string
    acType?: string
  }
  category?: "team_hub" | "solo_nook"
  nameVi?: string
  descriptionVi?: string
  addressVi?: string
  venueNameVi?: string
  specsVi?: {
    tvModel?: string
    hdmiVersion?: string
    whiteboardType?: string
    wifiSpeed?: string
    acType?: string
  }
}

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  available: boolean
  price: number
  isPast?: boolean
}

export interface Booking {
  id: string
  roomId: string
  roomName: string
  venueName: string
  venueAddress: string
  date: string
  startTime: string
  endTime: string
  duration: number
  guestName: string
  guestPhone: string
  guestEmail?: string
  totalPrice: number
  roomFee: number
  platformFee: number
  status: BookingStatus
  paymentMethod: PaymentMethod
  checkInQr: string
  wifiPassword: string
  createdAt: string
  paidAmount?: number
  paymentStatus?: "deposited" | "fully_paid"
  bookingCode?: string
  pointsRedeemed?: number
  pointsEarned?: number
  accessCode?: string
  checkedInAt?: string
}

export interface CheckInRecord {
  bookingId: string
  guestName: string
  roomName: string
  checkedInAt: string
}

export type RoomStatusReason = "walk_in" | "maintenance" | "private_event"

export interface RoomStatusEntry {
  status: "available" | "busy"
  reason?: RoomStatusReason
  timestamp: string
}

export interface Review {
  id: string
  roomId: string
  userName: string
  rating: number
  comment: string
  date: string
  commentVi?: string
}

export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  venueName: string
  venueId: string
  joinedDate: string
}

export interface EarningsData {
  date: string
  revenue: number
  bookings: number
  commission: number
}

export interface BookingFlowState {
  selectedRoom: Room | null
  selectedDate: string
  selectedSlots: TimeSlot[]
  guestName: string
  guestPhone: string
  guestEmail: string
  paymentMethod: PaymentMethod
  totalPrice: number
  roomFee: number
  platformFee: number
  bookingId: string | null
  confirmedBooking?: Booking | null
}


export type Dictionary = Record<string, string | Record<string, string>>

export type SupplierStatus = "pending" | "approved" | "rejected" | "suspended"

export interface Supplier {
  id: string
  legalName: string
  displayName: string
  taxCode: string | null
  businessEmail: string | null
  businessPhone: string | null
  status: SupplierStatus
  onboardingNote: string | null
  approvedAt: string | null
  approvedBy: string | null
  createdAt: string
  updatedAt: string
}
