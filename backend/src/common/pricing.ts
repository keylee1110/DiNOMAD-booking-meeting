/**
 * Single source of truth for DiNOMAD's money rules.
 *
 * Booking totals (BR-02):
 *   roomFee     = pricePerHour * hours          -> belongs to the venue
 *   platformFee = roomFee * PLATFORM_FEE_RATE   -> DiNOMAD's revenue, charged
 *                                                  to the guest ON TOP
 *   total       = roomFee + platformFee - pointsRedeemed
 *
 * Deposit option: the guest transfers DEPOSIT_ROOM_RATE of the room fee plus
 * the whole platform fee upfront, then pays the rest to the venue at the
 * counter. Keep these helpers as the only place those rules are expressed.
 */

export const PLATFORM_FEE_RATE = 0.1
export const DEPOSIT_ROOM_RATE = 0.2

/**
 * Most points a guest may redeem on one booking.
 *
 * Capped at the platform fee: the venue always receives the full room fee, so
 * every point redeemed comes out of DiNOMAD's own cut. Without this cap a
 * guest redeeming more than the fee would make DiNOMAD pay the venue more than
 * it collected — and at 100% redemption the guest would owe 0₫, so no bank
 * transfer would ever arrive to confirm the booking.
 */
export function maxPointsRedeemable(platformFee: number): number {
  return Math.max(0, Math.floor(platformFee))
}

/** Amount the guest transfers upfront when choosing the deposit option. */
export function depositAmount(subtotal: number, platformFee: number, pointsRedeemed = 0): number {
  return Math.max(0, Math.round(subtotal * DEPOSIT_ROOM_RATE + platformFee) - pointsRedeemed)
}

/**
 * Cash the venue still has to collect from the guest at the counter.
 * Fully-paid bookings owe nothing; deposit bookings owe the rest of the total.
 */
export function amountDueAtCounter(booking: {
  subtotal: number
  platform_fee: number
  total_amount?: number | null
  points_redeemed?: number | null
  payment_status?: string | null
}): number {
  if (booking.payment_status === "fully_paid") return 0

  const points = Number(booking.points_redeemed ?? 0)
  const total = Number(
    booking.total_amount ?? booking.subtotal + booking.platform_fee - points,
  )
  const paid = depositAmount(booking.subtotal, booking.platform_fee, points)
  return Math.max(0, total - paid)
}

/** Room-fee share DiNOMAD is holding for the venue (owed at settlement). */
export function roomFeeHeldByPlatform(booking: {
  subtotal: number
  payment_status?: string | null
}): number {
  return booking.payment_status === "fully_paid"
    ? booking.subtotal
    : Math.round(booking.subtotal * DEPOSIT_ROOM_RATE)
}
