import type { Venue, Partner, EarningsData } from "@/lib/types"

export const venues: Venue[] = [
  {
    id: "venue-001",
    name: "The Coffee Lab",
    address: "120 Vo Van Ngan, Linh Chieu, Thu Duc",
    district: "Thu Duc",
    city: "Ho Chi Minh City",
    lat: 10.8506,
    lng: 106.7722,
    phone: "028-1234-5678",
    partnerId: "partner-001",
    imageUrl: "/images/venues/coffee-lab.jpg",
  },
  {
    id: "venue-002",
    name: "Nomad Hub D10",
    address: "45 3 Thang 2, Ward 11, District 10",
    district: "District 10",
    city: "Ho Chi Minh City",
    lat: 10.7706,
    lng: 106.6688,
    phone: "028-2345-6789",
    partnerId: "partner-002",
    imageUrl: "/images/venues/nomad-hub.jpg",
  },
  {
    id: "venue-003",
    name: "Workspace Saigon",
    address: "789 Nguyen Van Linh, Tan Phu, District 7",
    district: "District 7",
    city: "Ho Chi Minh City",
    lat: 10.734,
    lng: 106.722,
    phone: "028-3456-7890",
    partnerId: "partner-003",
    imageUrl: "/images/venues/workspace-saigon.jpg",
  },
  {
    id: "venue-004",
    name: "BookCafe Central",
    address: "22 Hai Ba Trung, Ben Nghe, District 1",
    district: "District 1",
    city: "Ho Chi Minh City",
    lat: 10.7769,
    lng: 106.7009,
    phone: "028-4567-8901",
    partnerId: "partner-004",
    imageUrl: "/images/venues/bookcafe.jpg",
  },
  {
    id: "venue-005",
    name: "CoStudy BT",
    address: "167 No Trang Long, Ward 12, Binh Thanh",
    district: "Binh Thanh",
    city: "Ho Chi Minh City",
    lat: 10.801,
    lng: 106.712,
    phone: "028-5678-9012",
    partnerId: "partner-005",
    imageUrl: "/images/venues/costudy.jpg",
  },
]

export const partners: Partner[] = [
  {
    id: "partner-001",
    name: "Nguyen Van A",
    email: "a.nguyen@coffeelab.vn",
    phone: "0901-234-567",
    venueName: "The Coffee Lab",
    venueId: "venue-001",
    joinedDate: "2025-06-15",
  },
  {
    id: "partner-002",
    name: "Tran Thi B",
    email: "b.tran@nomadhub.vn",
    phone: "0912-345-678",
    venueName: "Nomad Hub D10",
    venueId: "venue-002",
    joinedDate: "2025-08-20",
  },
]

export const earningsData: EarningsData[] = [
  { date: "2026-02-01", revenue: 1200000, bookings: 8, commission: 120000 },
  { date: "2026-02-02", revenue: 950000, bookings: 6, commission: 95000 },
  { date: "2026-02-03", revenue: 1800000, bookings: 12, commission: 180000 },
  { date: "2026-02-04", revenue: 750000, bookings: 5, commission: 75000 },
  { date: "2026-02-05", revenue: 2100000, bookings: 14, commission: 210000 },
  { date: "2026-02-06", revenue: 1600000, bookings: 10, commission: 160000 },
  { date: "2026-02-07", revenue: 2400000, bookings: 16, commission: 240000 },
  { date: "2026-02-08", revenue: 1100000, bookings: 7, commission: 110000 },
  { date: "2026-02-09", revenue: 1350000, bookings: 9, commission: 135000 },
  { date: "2026-02-10", revenue: 1900000, bookings: 13, commission: 190000 },
  { date: "2026-02-11", revenue: 2200000, bookings: 15, commission: 220000 },
  { date: "2026-02-12", revenue: 1750000, bookings: 11, commission: 175000 },
  { date: "2026-02-13", revenue: 2050000, bookings: 14, commission: 205000 },
  { date: "2026-02-14", revenue: 2800000, bookings: 18, commission: 280000 },
]

export function getVenueById(id: string): Venue | undefined {
  return venues.find((v) => v.id === id)
}

export function getPartnerById(id: string): Partner | undefined {
  return partners.find((p) => p.id === id)
}
