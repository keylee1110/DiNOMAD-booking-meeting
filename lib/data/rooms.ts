import type { Room, Review, Amenity, VibeTag } from "@/lib/types"

export const rooms: Room[] = [
  {
    id: "room-001",
    venueId: "venue-001",
    venueName: "The Coffee Lab",
    name: "Focus Pod A",
    description: "A compact, ultra-quiet pod designed for focused work. Soundproofed walls, adjustable lighting, and a dedicated power strip. Ideal for 1-on-1 meetings or deep study sessions.",
    district: "Thu Duc",
    address: "120 Vo Van Ngan, Linh Chieu, Thu Duc",
    capacity: 4,
    pricePerHour: 80000,
    amenities: ["wifi", "ac", "power_outlets", "coffee", "water"],
    vibeTags: ["ultra_quiet", "cozy"],
    images: ["/images/rooms/room-001-1.jpg", "/images/rooms/room-001-2.jpg", "/images/rooms/room-001-3.jpg"],
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    slotsLeftToday: 3,
    noiseLevel: 9.5,
    lat: 10.8506,
    lng: 106.7722,
    specs: {
      wifiSpeed: "100 Mbps",
      acType: "Inverter - 18°C to 28°C",
    },
    category: "solo_nook",
  },
  {
    id: "room-002",
    venueId: "venue-001",
    venueName: "The Coffee Lab",
    name: "Collab Room B",
    description: "A spacious collaboration room with a 55-inch TV and whiteboard wall. Perfect for team brainstorming, group study, or project presentations.",
    district: "Thu Duc",
    address: "120 Vo Van Ngan, Linh Chieu, Thu Duc",
    capacity: 8,
    pricePerHour: 150000,
    amenities: ["wifi", "tv", "whiteboard", "ac", "hdmi", "power_outlets", "coffee"],
    vibeTags: ["discussion_friendly", "modern"],
    images: ["/images/rooms/room-002-1.jpg", "/images/rooms/room-002-2.jpg", "/images/rooms/room-002-3.jpg"],
    rating: 4.6,
    reviewCount: 89,
    verified: true,
    slotsLeftToday: 1,
    noiseLevel: 6.8,
    lat: 10.8510,
    lng: 106.7730,
    specs: {
      tvModel: "Samsung 55\" 4K Smart TV",
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Glass wall - markers provided",
      wifiSpeed: "100 Mbps",
      acType: "Inverter - 18°C to 28°C",
    },
    category: "team_hub",
  },
  {
    id: "room-003",
    venueId: "venue-002",
    venueName: "Nomad Hub D10",
    name: "Sunshine Meeting Room",
    description: "Bright and airy meeting room with floor-to-ceiling windows. Natural light fills the space, making it ideal for creative meetings and comfortable discussions.",
    district: "District 10",
    address: "45 3 Thang 2, Ward 11, District 10",
    capacity: 6,
    pricePerHour: 120000,
    amenities: ["wifi", "tv", "ac", "hdmi", "projector", "water"],
    vibeTags: ["natural_light", "modern", "discussion_friendly"],
    images: ["/images/rooms/room-003-1.jpg", "/images/rooms/room-003-2.jpg", "/images/rooms/room-003-3.jpg"],
    rating: 4.9,
    reviewCount: 201,
    verified: true,
    slotsLeftToday: 5,
    noiseLevel: 7.2,
    lat: 10.7706,
    lng: 106.6688,
    specs: {
      tvModel: "LG 50\" 4K UHD",
      hdmiVersion: "HDMI 2.0",
      wifiSpeed: "200 Mbps",
      acType: "Central AC - 20°C to 26°C",
    },
    category: "team_hub",
  },
  {
    id: "room-004",
    venueId: "venue-002",
    venueName: "Nomad Hub D10",
    name: "Private Study Booth",
    description: "A cozy single-person booth perfect for solo study, online meetings, or phone calls. Fully soundproofed with a comfortable ergonomic chair.",
    district: "District 10",
    address: "45 3 Thang 2, Ward 11, District 10",
    capacity: 2,
    pricePerHour: 60000,
    amenities: ["wifi", "ac", "power_outlets", "water"],
    vibeTags: ["ultra_quiet", "cozy"],
    images: ["/images/rooms/room-004-1.jpg", "/images/rooms/room-004-2.jpg"],
    rating: 4.5,
    reviewCount: 67,
    verified: true,
    slotsLeftToday: 7,
    noiseLevel: 9.8,
    lat: 10.7710,
    lng: 106.6692,
    specs: {
      wifiSpeed: "200 Mbps",
      acType: "Portable AC unit",
    },
    category: "solo_nook",
  },
  {
    id: "room-005",
    venueId: "venue-003",
    venueName: "Workspace Saigon",
    name: "Executive Board Room",
    description: "Professional boardroom with premium furniture, a 65-inch presentation screen, and video conferencing setup. Perfect for client meetings and formal presentations.",
    district: "District 7",
    address: "789 Nguyen Van Linh, Tan Phu, District 7",
    capacity: 12,
    pricePerHour: 250000,
    amenities: ["wifi", "tv", "whiteboard", "ac", "hdmi", "projector", "power_outlets", "coffee", "water", "parking"],
    vibeTags: ["modern", "discussion_friendly"],
    images: ["/images/rooms/room-005-1.jpg", "/images/rooms/room-005-2.jpg", "/images/rooms/room-005-3.jpg"],
    rating: 4.7,
    reviewCount: 156,
    verified: true,
    slotsLeftToday: 2,
    noiseLevel: 8,
    lat: 10.7340,
    lng: 106.7220,
    specs: {
      tvModel: 'Samsung 65" QLED 4K',
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Interactive smart board",
      wifiSpeed: "500 Mbps fiber",
      acType: "Central AC - adjustable",
    },
    category: "team_hub",
  },
  {
    id: "room-006",
    venueId: "venue-003",
    venueName: "Workspace Saigon",
    name: "Garden View Room",
    description: "A relaxed meeting room overlooking the garden area. Large windows and warm wooden decor create a comfortable atmosphere for informal meetings.",
    district: "District 7",
    address: "789 Nguyen Van Linh, Tan Phu, District 7",
    capacity: 6,
    pricePerHour: 180000,
    amenities: ["wifi", "tv", "ac", "hdmi", "coffee", "water", "parking"],
    vibeTags: ["garden_view", "cozy", "natural_light"],
    images: ["/images/rooms/room-006-1.jpg", "/images/rooms/room-006-2.jpg", "/images/rooms/room-006-3.jpg"],
    rating: 4.8,
    reviewCount: 98,
    verified: true,
    slotsLeftToday: 4,
    noiseLevel: 8.5,
    lat: 10.7345,
    lng: 106.7228,
    specs: {
      tvModel: 'LG 55" OLED',
      hdmiVersion: "HDMI 2.0",
      wifiSpeed: "500 Mbps fiber",
      acType: "Central AC - adjustable",
    },
    category: "team_hub",
  },
  {
    id: "room-007",
    venueId: "venue-004",
    venueName: "BookCafe Central",
    name: "Rooftop Pod",
    description: "An open-air meeting pod on the rooftop with stunning city views. Covered and fan-cooled, this unique space is perfect for creative brainstorming sessions.",
    district: "District 1",
    address: "22 Hai Ba Trung, Ben Nghe, District 1",
    capacity: 4,
    pricePerHour: 100000,
    amenities: ["wifi", "power_outlets", "coffee", "water"],
    vibeTags: ["rooftop", "natural_light", "cozy"],
    images: ["/images/rooms/room-007-1.jpg", "/images/rooms/room-007-2.jpg", "/images/rooms/room-007-3.jpg"],
    rating: 4.4,
    reviewCount: 45,
    verified: false,
    slotsLeftToday: 6,
    noiseLevel: 7.5,
    lat: 10.7769,
    lng: 106.7009,
    specs: {
      wifiSpeed: "50 Mbps",
    },
    category: "solo_nook",
  },
  {
    id: "room-008",
    venueId: "venue-005",
    venueName: "CoStudy BT",
    name: "Group Study Hall",
    description: "A large open study hall divided into semi-private sections. Great for study groups of 4-10 people who want a dedicated area without full room rental.",
    district: "Binh Thanh",
    address: "167 No Trang Long, Ward 12, Binh Thanh",
    capacity: 10,
    pricePerHour: 90000,
    amenities: ["wifi", "whiteboard", "ac", "power_outlets", "water"],
    vibeTags: ["discussion_friendly", "modern"],
    images: ["/images/rooms/room-008-1.jpg", "/images/rooms/room-008-2.jpg", "/images/rooms/room-008-3.jpg"],
    rating: 4.3,
    reviewCount: 78,
    verified: true,
    slotsLeftToday: 2,
    noiseLevel: 6.5,
    lat: 10.8010,
    lng: 106.7120,
    specs: {
      whiteboardType: "Standard whiteboard - markers available",
      wifiSpeed: "100 Mbps",
      acType: "Split AC units",
    },
    category: "team_hub",
  },
  {
    id: "room-009",
    venueId: "venue-005",
    venueName: "CoStudy BT",
    name: "Quiet Corner",
    description: "A tucked-away corner space designed for solo or duo work. Minimalist design with warm lighting and noise-canceling partitions.",
    district: "Binh Thanh",
    address: "167 No Trang Long, Ward 12, Binh Thanh",
    capacity: 2,
    pricePerHour: 50000,
    amenities: ["wifi", "ac", "power_outlets", "coffee"],
    vibeTags: ["ultra_quiet", "cozy"],
    images: ["/images/rooms/room-009-1.jpg", "/images/rooms/room-009-2.jpg"],
    rating: 4.6,
    reviewCount: 53,
    verified: true,
    slotsLeftToday: 8,
    noiseLevel: 9.2,
    lat: 10.8015,
    lng: 106.7125,
    specs: {
      wifiSpeed: "100 Mbps",
      acType: "Split AC",
    },
    category: "solo_nook",
  },
  {
    id: "room-010",
    venueId: "venue-004",
    venueName: "BookCafe Central",
    name: "Library Room",
    description: "Elegant meeting room surrounded by bookshelves. A peaceful, library-like atmosphere with premium furniture and excellent soundproofing.",
    district: "District 1",
    address: "22 Hai Ba Trung, Ben Nghe, District 1",
    capacity: 8,
    pricePerHour: 200000,
    amenities: ["wifi", "tv", "whiteboard", "ac", "hdmi", "power_outlets", "coffee", "water"],
    vibeTags: ["ultra_quiet", "modern", "natural_light"],
    images: ["/images/rooms/room-010-1.jpg", "/images/rooms/room-010-2.jpg", "/images/rooms/room-010-3.jpg"],
    rating: 4.9,
    reviewCount: 210,
    verified: true,
    slotsLeftToday: 1,
    noiseLevel: 9.6,
    lat: 10.7775,
    lng: 106.7015,
    specs: {
      tvModel: 'Sony 55" Bravia 4K',
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Glass board - premium markers",
      wifiSpeed: "300 Mbps",
      acType: "Central AC - whisper quiet",
    },
    category: "team_hub",
  },
]

export const reviews: Review[] = [
  { id: "rev-1", roomId: "room-001", userName: "Minh T.", rating: 5, comment: "Super quiet, perfect for studying before exams. The AC is great!", date: "2026-02-15" },
  { id: "rev-2", roomId: "room-001", userName: "Linh N.", rating: 4, comment: "Good value for money. Wifi was stable throughout my 3-hour session.", date: "2026-02-10" },
  { id: "rev-3", roomId: "room-002", userName: "Huy P.", rating: 5, comment: "Used the TV for our group presentation practice. Excellent setup!", date: "2026-02-20" },
  { id: "rev-4", roomId: "room-003", userName: "An L.", rating: 5, comment: "Best natural light I've seen in a meeting room. Love the vibe!", date: "2026-02-18" },
  { id: "rev-5", roomId: "room-005", userName: "Thao V.", rating: 4, comment: "Very professional space. Perfect for our client meeting.", date: "2026-02-22" },
  { id: "rev-6", roomId: "room-010", userName: "Duc M.", rating: 5, comment: "The library atmosphere is amazing. Best room in Saigon for focused work.", date: "2026-02-25" },
  { id: "rev-7", roomId: "room-007", userName: "Mai H.", rating: 4, comment: "Rooftop view is incredible. A bit warm in the afternoon but worth it.", date: "2026-02-12" },
  { id: "rev-8", roomId: "room-008", userName: "Khanh D.", rating: 4, comment: "Great for our study group. The whiteboard was very helpful.", date: "2026-02-14" },
]

export function getRoomById(id: string): Room | undefined {
  return rooms.find((r) => r.id === id)
}

export function getReviewsByRoomId(roomId: string): Review[] {
  return reviews.filter((r) => r.roomId === roomId)
}

export function searchRooms(filters: {
  district?: string
  minCapacity?: number
  maxPrice?: number
  amenities?: string[]
  vibeTags?: string[]
  query?: string
}): Room[] {
  let result = [...rooms]

  if (filters.district) {
    result = result.filter((r) => r.district === filters.district)
  }
  if (filters.minCapacity) {
    result = result.filter((r) => r.capacity >= filters.minCapacity!)
  }
  if (filters.maxPrice) {
    result = result.filter((r) => r.pricePerHour <= filters.maxPrice!)
  }
  if (filters.amenities && filters.amenities.length > 0) {
    result = result.filter((r) => filters.amenities!.every((a) => r.amenities.includes(a as Amenity)))
  }
  if (filters.vibeTags && filters.vibeTags.length > 0) {
    result = result.filter((r) => filters.vibeTags!.some((v) => r.vibeTags.includes(v as VibeTag)))
  }
  if (filters.query) {
    const q = filters.query.toLowerCase()
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.venueName.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    )
  }

  return result
}
