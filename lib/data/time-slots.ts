import type { TimeSlot } from "@/lib/types"

/** Vietnam timezone offset in hours (UTC+7) */
const VN_OFFSET_H = 7

/**
 * Get current hour and minute in Vietnam time (UTC+7),
 * regardless of the browser's local timezone.
 */
function getNowVietnam(): { date: string; hour: number; minute: number } {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000
  const vnMs = utcMs + VN_OFFSET_H * 3_600_000
  const vn = new Date(vnMs)
  const year = vn.getFullYear()
  const month = String(vn.getMonth() + 1).padStart(2, "0")
  const day = String(vn.getDate()).padStart(2, "0")
  return {
    date: `${year}-${month}-${day}`,
    hour: vn.getHours(),
    minute: vn.getMinutes(),
  }
}

export function generateTimeSlots(date: string, roomId: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const bookedSlotSeed = hashCode(date + roomId)
  const now = getNowVietnam()
  const isToday = date === now.date

  for (let hour = 7; hour < 22; hour++) {
    const startHour = hour.toString().padStart(2, "0")
    const endHour = (hour + 1).toString().padStart(2, "0")

    const slotIndex = hour - 7
    const isBooked = isSlotBooked(bookedSlotSeed, slotIndex)

    // A slot is "past" if today is selected AND the slot's end time has already passed
    // e.g. at 16:05, slots ending at or before 16:00 are past (i.e. startHour < currentHour)
    // We use strict < so the CURRENT hour's slot is still bookable (e.g. at 15:55, 15:00 slot is still shown)
    const isPast = isToday && hour < now.hour

    slots.push({
      id: `${date}-${startHour}00`,
      startTime: `${startHour}:00`,
      endTime: `${endHour}:00`,
      available: !isBooked && !isPast,
      isPast,
      price: 0,
    })
  }

  return slots
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

function isSlotBooked(seed: number, slotIndex: number): boolean {
  const combined = seed * 31 + slotIndex * 17
  return combined % 5 === 0 || combined % 7 === 0
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

export function getAvailableSlotsCount(date: string, roomId: string): number {
  const slots = generateTimeSlots(date, roomId)
  return slots.filter((s) => s.available && !s.isPast).length
}

/** Remaining bookable slots for today (Vietnam time) — matches the room page slot grid */
export function getSlotsLeftToday(roomId: string): number {
  return getAvailableSlotsCount(getNowVietnam().date, roomId)
}
