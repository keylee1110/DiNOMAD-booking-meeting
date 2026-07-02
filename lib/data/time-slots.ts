export function formatTime(time: string): string {
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

/**
 * Approximate remaining 1-hour slots today from venue operating hours,
 * counted from the current hour in Vietnam time (UTC+7).
 * Mirrors the backend's computeSlotsLeft — an upper bound that ignores
 * bookings, cheap enough to run per room card without extra requests.
 */
export function computeSlotsLeftToday(openTime: string | null, closeTime: string | null): number {
  if (!openTime || !closeTime) return 0
  const openHour = parseInt(openTime.split(":")[0], 10)
  const closeHour = parseInt(closeTime.split(":")[0], 10)
  if (Number.isNaN(openHour) || Number.isNaN(closeHour)) return 0
  const vnHour = (new Date().getUTCHours() + 7) % 24
  return Math.max(0, closeHour - Math.max(openHour, vnHour))
}
