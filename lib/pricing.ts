/**
 * Money rules for the guest-facing app. Mirrors backend/src/common/pricing.ts —
 * keep the two in sync; the backend is the authority (it validates real
 * transfers in payments.service.ts).
 *
 *   roomFee     = pricePerHour * hours          -> belongs to the venue
 *   platformFee = roomFee * PLATFORM_FEE_RATE   -> charged to the guest ON TOP
 *   total       = roomFee + platformFee - pointsRedeemed
 */

export const PLATFORM_FEE_RATE = 0.1
export const DEPOSIT_ROOM_RATE = 0.2

/**
 * Most points a guest may redeem on one booking — capped at the platform fee.
 * The venue always keeps the full room fee, so points come out of DiNOMAD's
 * cut; redeeming beyond the fee would put DiNOMAD at a loss on the booking.
 * Mirrors maxPointsRedeemable in backend/src/common/pricing.ts (the authority).
 */
export function maxPointsRedeemable(platformFee: number): number {
  return Math.max(0, Math.floor(platformFee))
}

/** Amount the guest transfers upfront when choosing the deposit option. */
export function depositAmount(roomFee: number, platformFee: number, pointsRedeemed = 0): number {
  return Math.max(0, Math.round(roomFee * DEPOSIT_ROOM_RATE + platformFee) - pointsRedeemed)
}

/** What the guest still owes the venue at the counter (0 when paid in full). */
export function amountDueAtCounter(booking: {
  roomFee: number
  platformFee: number
  totalPrice: number
  pointsRedeemed?: number
  paymentStatus?: string | null
}): number {
  if (booking.paymentStatus !== "deposited") return 0
  const paid = depositAmount(booking.roomFee, booking.platformFee, booking.pointsRedeemed ?? 0)
  return Math.max(0, booking.totalPrice - paid)
}
