import type { Room, Review, Amenity, VibeTag } from "@/lib/types"

export const rooms: Room[] = [
  {
    id: "room-001",
    venueId: "venue-001",
    venueName: "The Coffee Lab",
    venueNameVi: "The Coffee Lab",
    name: "Focus Pod A",
    nameVi: "Phòng Tập Trung A (Focus Pod)",
    description: "A compact, ultra-quiet pod designed for focused work. Soundproofed walls, adjustable lighting, and a dedicated power strip. Ideal for 1-on-1 meetings or deep study sessions.",
    descriptionVi: "Phòng cabin đơn siêu yên tĩnh, được thiết kế tối ưu cho việc tập trung cao độ. Tường cách âm cao cấp, hệ thống ánh sáng tùy chỉnh và ổ cắm điện chuyên dụng. Lý tưởng cho các cuộc họp 1-1 hoặc các buổi tự học chuyên sâu.",
    district: "Thu Duc",
    address: "120 Vo Van Ngan, Linh Chieu, Thu Duc",
    addressVi: "120 Võ Văn Ngân, Linh Chiểu, Thủ Đức",
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
    specsVi: {
      wifiSpeed: "100 Mbps",
      acType: "Inverter - 18°C đến 28°C",
    },
    category: "solo_nook",
  },
  {
    id: "room-002",
    venueId: "venue-001",
    venueName: "The Coffee Lab",
    venueNameVi: "The Coffee Lab",
    name: "Collab Room B",
    nameVi: "Phòng Thảo Luận B (Collab Room)",
    description: "A spacious collaboration room with a 55-inch TV and whiteboard wall. Perfect for team brainstorming, group study, or project presentations.",
    descriptionVi: "Phòng thảo luận nhóm rộng rãi trang bị sẵn TV 55-inch và mảng tường bảng trắng lớn. Cực kỳ thích hợp cho các buổi brainstorm ý tưởng, học nhóm hoặc thuyết trình dự án.",
    district: "Thu Duc",
    address: "120 Vo Van Ngan, Linh Chieu, Thu Duc",
    addressVi: "120 Võ Văn Ngân, Linh Chiểu, Thủ Đức",
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
    specsVi: {
      tvModel: "Smart TV Samsung 55\" 4K",
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Tường kính viết bảng - trang bị sẵn bút lông",
      wifiSpeed: "100 Mbps",
      acType: "Inverter - 18°C đến 28°C",
    },
    category: "team_hub",
  },
  {
    id: "room-003",
    venueId: "venue-002",
    venueName: "Nomad Hub D10",
    venueNameVi: "Nomad Hub Quận 10",
    name: "Sunshine Meeting Room",
    nameVi: "Phòng Họp Hướng Dương",
    description: "Bright and airy meeting room with floor-to-ceiling windows. Natural light fills the space, making it ideal for creative meetings and comfortable discussions.",
    descriptionVi: "Phòng họp ngập tràn ánh nắng và thoáng mát với hệ kính sát trần từ sàn đến trần. Ánh sáng tự nhiên giúp tạo cảm hứng tuyệt vời, cực kỳ lý tưởng cho các buổi họp sáng tạo và thảo luận nhóm thoải mái.",
    district: "District 10",
    address: "45 3 Thang 2, Ward 11, District 10",
    addressVi: "45 Đường 3 Tháng 2, Phường 11, Quận 10",
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
    specsVi: {
      tvModel: "LG 50\" 4K UHD",
      hdmiVersion: "HDMI 2.0",
      wifiSpeed: "200 Mbps",
      acType: "Máy lạnh trung tâm - 20°C đến 26°C",
    },
    category: "team_hub",
  },
  {
    id: "room-004",
    venueId: "venue-002",
    venueName: "Nomad Hub D10",
    venueNameVi: "Nomad Hub Quận 10",
    name: "Private Study Booth",
    nameVi: "Buồng Tự Học Riêng Tư (Study Booth)",
    description: "A cozy single-person booth perfect for solo study, online meetings, or phone calls. Fully soundproofed with a comfortable ergonomic chair.",
    descriptionVi: "Buồng học đơn ấm cúng hoàn hảo cho việc tự học, họp trực tuyến hoặc thực hiện cuộc gọi cá nhân. Cách âm hoàn toàn với ghế ngồi công thái học cực kỳ dễ chịu.",
    district: "District 10",
    address: "45 3 Thang 2, Ward 11, District 10",
    addressVi: "45 Đường 3 Tháng 2, Phường 11, Quận 10",
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
    specsVi: {
      wifiSpeed: "200 Mbps",
      acType: "Máy lạnh di động cá nhân",
    },
    category: "solo_nook",
  },
  {
    id: "room-005",
    venueId: "venue-003",
    venueName: "Workspace Saigon",
    venueNameVi: "Saigon Workspace",
    name: "Executive Board Room",
    nameVi: "Phòng Họp Ban Giám Đốc",
    description: "Professional boardroom with premium furniture, a 65-inch presentation screen, and video conferencing setup. Perfect for client meetings and formal presentations.",
    descriptionVi: "Phòng hội nghị chuyên nghiệp với nội thất cao cấp sang trọng, màn hình trình chiếu 65-inch sắc nét và hệ thống hỗ trợ họp trực tuyến trực quan. Hoàn hảo cho các cuộc họp đối tác khách hàng và thuyết trình cấp cao.",
    district: "District 7",
    address: "789 Nguyen Van Linh, Tan Phu, District 7",
    addressVi: "789 Nguyễn Văn Linh, Tân Phú, Quận 7",
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
    specsVi: {
      tvModel: 'Samsung 65" QLED 4K',
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Bảng trắng tương tác thông minh",
      wifiSpeed: "Cáp quang 500 Mbps",
      acType: "Điều hòa trung tâm điều chỉnh nhiệt độ độc lập",
    },
    category: "team_hub",
  },
  {
    id: "room-006",
    venueId: "venue-003",
    venueName: "Workspace Saigon",
    venueNameVi: "Saigon Workspace",
    name: "Garden View Room",
    nameVi: "Phòng Họp Hướng Sân Vườn",
    description: "A relaxed meeting room overlooking the garden area. Large windows and warm wooden decor create a comfortable atmosphere for informal meetings.",
    descriptionVi: "Phòng họp thư giãn với hướng nhìn ra khuôn viên sân vườn xanh mát. Hệ cửa kính lớn đón nắng cùng thiết kế nội thất gỗ ấm áp tạo nên bầu không khí thoải mái, giảm căng thẳng tối đa cho các buổi họp nội bộ.",
    district: "District 7",
    address: "789 Nguyen Van Linh, Tan Phu, District 7",
    addressVi: "789 Nguyễn Văn Linh, Tân Phú, Quận 7",
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
    specsVi: {
      tvModel: 'LG 55" OLED',
      hdmiVersion: "HDMI 2.0",
      wifiSpeed: "Cáp quang 500 Mbps",
      acType: "Điều hòa trung tâm điều chỉnh nhiệt độ độc lập",
    },
    category: "team_hub",
  },
  {
    id: "room-007",
    venueId: "venue-004",
    venueName: "BookCafe Central",
    venueNameVi: "BookCafe Central",
    name: "Rooftop Pod",
    nameVi: "Cabin Sân Thượng Độc Đáo",
    description: "An open-air meeting pod on the rooftop with stunning city views. Covered and fan-cooled, this unique space is perfect for creative brainstorming sessions.",
    descriptionVi: "Không gian họp mở độc đáo trên tầng thượng với tầm nhìn toàn cảnh thành phố cực đẹp. Được trang bị mái che và hệ thống quạt mát mát mẻ, đây là nơi tuyệt vời để kích thích tư duy đột phá và brainstorm ý tưởng sáng tạo.",
    district: "District 1",
    address: "22 Hai Ba Trung, Ben Nghe, District 1",
    addressVi: "22 Hai Bà Trưng, Bến Nghé, Quận 1",
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
    specsVi: {
      wifiSpeed: "50 Mbps",
    },
    category: "solo_nook",
  },
  {
    id: "room-008",
    venueId: "venue-005",
    venueName: "CoStudy BT",
    venueNameVi: "CoStudy Bình Thạnh",
    name: "Group Study Hall",
    nameVi: "Không Gian Học Nhóm Lớn (Study Hall)",
    description: "A large open study hall divided into semi-private sections. Great for study groups of 4-10 people who want a dedicated area without full room rental.",
    descriptionVi: "Sảnh học tập rộng lớn được phân chia khéo léo thành các khu vực bán riêng tư. Thích hợp cho các nhóm học tập từ 4-10 người muốn có một khu vực làm việc tập trung mà không cần thuê phòng kín hoàn toàn.",
    district: "Binh Thanh",
    address: "167 No Trang Long, Ward 12, Binh Thanh",
    addressVi: "167 Nơ Trang Long, Phường 12, Bình Thạnh",
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
    specsVi: {
      whiteboardType: "Bảng trắng tiêu chuẩn - trang bị sẵn bút viết",
      wifiSpeed: "100 Mbps",
      acType: "Hệ thống máy lạnh treo tường cục bộ",
    },
    category: "team_hub",
  },
  {
    id: "room-009",
    venueId: "venue-005",
    venueName: "CoStudy BT",
    venueNameVi: "CoStudy Bình Thạnh",
    name: "Quiet Corner",
    nameVi: "Góc Làm Việc Yên Tĩnh (Quiet Corner)",
    description: "A tucked-away corner space designed for solo or duo work. Minimalist design with warm lighting and noise-canceling partitions.",
    descriptionVi: "Góc làm việc nhỏ nhắn nằm yên tĩnh ở khu vực phía trong, thiết kế riêng cho khách tự học hoặc làm việc cặp đôi. Phong cách tối giản đi kèm ánh sáng ấm và vách ngăn tiêu âm cao.",
    district: "Binh Thanh",
    address: "167 No Trang Long, Ward 12, Binh Thanh",
    addressVi: "167 Nơ Trang Long, Phường 12, Bình Thạnh",
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
    specsVi: {
      wifiSpeed: "100 Mbps",
      acType: "Máy lạnh treo tường",
    },
    category: "solo_nook",
  },
  {
    id: "room-010",
    venueId: "venue-004",
    venueName: "BookCafe Central",
    venueNameVi: "BookCafe Central",
    name: "Library Room",
    nameVi: "Phòng Họp Thư Viện Cổ Điển",
    description: "Elegant meeting room surrounded by bookshelves. A peaceful, library-like atmosphere with premium furniture and excellent soundproofing.",
    descriptionVi: "Phòng họp sang trọng được bao quanh bởi các kệ sách gỗ lớn. Không gian mang tính học thuật cao, yên tĩnh như thư viện với nội thất cao cấp cùng hệ thống cách âm tuyệt vời.",
    district: "District 1",
    address: "22 Hai Ba Trung, Ben Nghe, District 1",
    addressVi: "22 Hai Bà Trưng, Bến Nghé, Quận 1",
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
    specsVi: {
      tvModel: 'Sony 55" Bravia 4K',
      hdmiVersion: "HDMI 2.1",
      whiteboardType: "Bảng kính cao cấp - trang bị sẵn bút lông",
      wifiSpeed: "300 Mbps",
      acType: "Hệ thống máy lạnh trung tâm siêu êm dịu",
    },
    category: "team_hub",
  },
]

export const reviews: Review[] = [
  { id: "rev-1", roomId: "room-001", userName: "Minh T.", rating: 5, comment: "Super quiet, perfect for studying before exams. The AC is great!", commentVi: "Siêu yên tĩnh, cực kỳ phù hợp để ôn thi học kỳ. Máy lạnh chạy rất mát mẻ!", date: "2026-02-15" },
  { id: "rev-2", roomId: "room-001", userName: "Linh N.", rating: 4, comment: "Good value for money. Wifi was stable throughout my 3-hour session.", commentVi: "Rất đáng tiền. Đường truyền Wifi cực kỳ ổn định suốt cả buổi học nhóm 3 tiếng của mình.", date: "2026-02-10" },
  { id: "rev-3", roomId: "room-002", userName: "Huy P.", rating: 5, comment: "Used the TV for our group presentation practice. Excellent setup!", commentVi: "Đã sử dụng màn hình TV lớn để thực hành thuyết trình nhóm. Tiện nghi và không gian tuyệt vời!", date: "2026-02-20" },
  { id: "rev-4", roomId: "room-003", userName: "An L.", rating: 5, comment: "Best natural light I've seen in a meeting room. Love the vibe!", commentVi: "Ánh sáng tự nhiên đẹp nhất mình từng thấy trong phòng họp. Rất thích không khí sáng tạo ở đây!", date: "2026-02-18" },
  { id: "rev-5", roomId: "room-005", userName: "Thao V.", rating: 4, comment: "Very professional space. Perfect for our client meeting.", commentVi: "Không gian làm việc vô cùng chuyên nghiệp và sang trọng. Rất thích hợp cho các buổi tiếp khách hàng.", date: "2026-02-22" },
  { id: "rev-6", roomId: "room-010", userName: "Duc M.", rating: 5, comment: "The library atmosphere is amazing. Best room in Saigon for focused work.", commentVi: "Bầu không khí thư viện rất tuyệt vời. Địa điểm tốt nhất Sài Gòn để tự học và làm việc tập trung cao độ.", date: "2026-02-25" },
  { id: "rev-7", roomId: "room-007", userName: "Mai H.", rating: 4, comment: "Rooftop view is incredible. A bit warm in the afternoon but worth it.", commentVi: "Tầm nhìn từ sân thượng hướng thành phố siêu đẹp. Hơi nóng một chút vào buổi chiều nhưng rất đáng trải nghiệm.", date: "2026-02-12" },
  { id: "rev-8", roomId: "room-008", userName: "Khanh D.", rating: 4, comment: "Great for our study group. The whiteboard was very helpful.", commentVi: "Cực kỳ thích hợp cho nhóm học tập của tụi mình. Chiếc bảng trắng lớn hỗ trợ thảo luận rất nhiều.", date: "2026-02-14" },
]

export function getLocalizedRoom(room: Room, locale: string): Room {
  if (locale === "vi") {
    return {
      ...room,
      name: room.nameVi || room.name,
      description: room.descriptionVi || room.description,
      address: room.addressVi || room.address,
      venueName: room.venueNameVi || room.venueName,
      specs: (room.specsVi as any) || room.specs,
    }
  }
  return room
}

export function getRoomById(id: string, locale?: string): Room | undefined {
  const room = rooms.find((r) => r.id === id)
  if (!room) return undefined
  if (locale) return getLocalizedRoom(room, locale)
  return room
}

export function getReviewsByRoomId(roomId: string, locale?: string): Review[] {
  const roomReviews = reviews.filter((r) => r.roomId === roomId)
  if (locale === "vi") {
    return roomReviews.map((r) => ({
      ...r,
      comment: r.commentVi || r.comment,
    }))
  }
  return roomReviews
}

export function searchRooms(
  filters: {
    district?: string
    minCapacity?: number
    maxPrice?: number
    amenities?: string[]
    vibeTags?: string[]
    query?: string
    category?: string
    verified?: boolean
    noiseLevelMin?: number
    date?: string
    page?: number
    pageSize?: number
  },
  locale?: string
): { rooms: Room[]; total: number; page: number; pageSize: number; totalPages: number } {
  let list = [...rooms]
  if (locale) {
    list = list.map((r) => getLocalizedRoom(r, locale))
  }

  let result = list

  if (filters.district) {
    const filterDistrictLower = filters.district.toLowerCase()
    result = result.filter((r) => {
      const roomDistrictLower = r.district.toLowerCase()
      if (filterDistrictLower === "thu duc") {
        return roomDistrictLower === "thu duc" || roomDistrictLower.includes("thủ đức")
      }
      if (filterDistrictLower === "district 1") {
        return roomDistrictLower === "district 1" || roomDistrictLower.includes("quận 1")
      }
      if (filterDistrictLower === "district 7") {
        return roomDistrictLower === "district 7" || roomDistrictLower.includes("quận 7")
      }
      if (filterDistrictLower === "district 10") {
        return roomDistrictLower === "district 10" || roomDistrictLower.includes("quận 10")
      }
      if (filterDistrictLower === "binh thanh") {
        return roomDistrictLower === "binh thanh" || roomDistrictLower.includes("bình thạnh")
      }
      return roomDistrictLower === filterDistrictLower
    })
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
  if (filters.category) {
    result = result.filter((r) => r.category === filters.category)
  }
  if (filters.verified) {
    result = result.filter((r) => r.verified)
  }
  if (filters.noiseLevelMin) {
    result = result.filter((r) => (r.noiseLevel ?? 0) >= filters.noiseLevelMin!)
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

  const total = result.length
  const pageSize = filters.pageSize || 6
  const page = filters.page || 1
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const paginated = result.slice(start, start + pageSize)

  return { rooms: paginated, total, page, pageSize, totalPages }
}
