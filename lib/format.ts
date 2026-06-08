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

export function generateBookingId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0")
  return `BK-${dateStr}-${rand}`
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
