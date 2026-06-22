export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0vnđ"
}

export function formatVNDFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0vnđ"
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
