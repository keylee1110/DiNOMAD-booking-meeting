export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0₫"
}

export function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

export function formatDate(dateStr: string, locale: string = "en"): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

// DB stores district names as partner-entered text (usually English, e.g. "District 9",
// "Hoc Mon"). This maps them to the display language without touching the stored value,
// so search filters that compare raw district strings keep working.
const DISTRICT_VI: Record<string, string> = {
  "thu duc": "Thủ Đức",
  "binh thanh": "Bình Thạnh",
  "hoc mon": "Hóc Môn",
  "go vap": "Gò Vấp",
  "phu nhuan": "Phú Nhuận",
  "tan binh": "Tân Bình",
  "tan phu": "Tân Phú",
  "binh tan": "Bình Tân",
  "nha be": "Nhà Bè",
  "binh chanh": "Bình Chánh",
  "cu chi": "Củ Chi",
  "can gio": "Cần Giờ",
}

export function formatDistrict(district: string, locale: string): string {
  const trimmed = (district ?? "").trim()
  if (!trimmed) return trimmed
  if (locale === "vi") {
    const numbered = trimmed.match(/^district\s+(\d+)$/i)
    if (numbered) return `Quận ${numbered[1]}`
    return DISTRICT_VI[trimmed.toLowerCase()] ?? trimmed
  }
  const viNumbered = trimmed.match(/^quận\s+(\d+)$/i)
  if (viNumbered) return `District ${viNumbered[1]}`
  return trimmed
}

export function generateBookingId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getNextDays(count: number): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const dateVal = String(d.getDate()).padStart(2, "0")
    days.push(`${year}-${month}-${dateVal}`)
  }
  return days
}
