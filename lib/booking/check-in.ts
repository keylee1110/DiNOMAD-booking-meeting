export function selectCustomerRooms<T>(publicRooms: T[], demoRooms: T[]): T[] {
  return publicRooms.length > 0 ? publicRooms : demoRooms
}

export function createAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")
}

export function buildCheckInQrPayload(bookingId: string, accessCode: string): string {
  return `${bookingId}:${accessCode.trim().toUpperCase()}`
}
