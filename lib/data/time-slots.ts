import type { TimeSlot } from "@/lib/types"

export function generateTimeSlots(date: string, roomId: string): TimeSlot[] {
  const slots: TimeSlot[] = []
  const bookedSlotSeed = hashCode(date + roomId)

  for (let hour = 7; hour < 22; hour++) {
    for (let half = 0; half < 2; half++) {
      const startHour = hour.toString().padStart(2, "0")
      const startMin = half === 0 ? "00" : "30"
      const endHour = half === 1 ? (hour + 1).toString().padStart(2, "0") : startHour
      const endMin = half === 0 ? "30" : "00"

      const slotIndex = (hour - 7) * 2 + half
      const isBooked = isSlotBooked(bookedSlotSeed, slotIndex)

      slots.push({
        id: `${date}-${startHour}${startMin}`,
        startTime: `${startHour}:${startMin}`,
        endTime: `${endHour}:${endMin}`,
        available: !isBooked,
        price: 0,
      })
    }
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
  return slots.filter((s) => s.available).length
}
