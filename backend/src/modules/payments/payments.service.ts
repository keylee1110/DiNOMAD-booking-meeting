import { Injectable, Logger } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"

export interface SePayWebhookPayload {
  id: number
  gateway: string
  transactionDate: string
  accountNumber: string
  subAccount: string
  code: string | null
  content: string
  transferType: string
  description: string
  transferAmount: number
  accumulated: number
  referenceCode: string
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(private readonly supabase: SupabaseService) {}

  async processWebhook(payload: any) {
    const transactionId = payload.id
    const transferAmount = parseInt(payload.amount_in || payload.transferAmount || "0", 10)
    const content = payload.content || ""
    const referenceCode = payload.referenceCode || ""

    this.logger.log(
      `Received SePay webhook. ID: ${transactionId}, Amount: ${transferAmount}, Content: "${content}", Ref: ${referenceCode}`
    )

    // 1. Extract booking code from transaction content (either pre-parsed by SePay, or via regex)
    let bookingCode = payload.code
    if (!bookingCode) {
      const match = content.match(/DN[A-Z0-9]{6}/i)
      if (match) {
        bookingCode = match[0].toUpperCase()
      }
    } else {
      bookingCode = bookingCode.toUpperCase()
    }

    if (!bookingCode) {
      // Fallback: also check with hyphen just in case
      const matchHyphen = content.match(/DN-[A-Z0-9]{6}/i)
      if (matchHyphen) {
        bookingCode = matchHyphen[0].toUpperCase()
      }
    }

    if (!bookingCode) {
      this.logger.warn(`No booking code found in transfer content: "${content}"`)
      return { success: false, message: "No booking code found in content" }
    }

    // Standardize to database format with hyphen: DN-XXXXXX
    let dbBookingCode = bookingCode
    if (!dbBookingCode.includes("-") && dbBookingCode.startsWith("DN")) {
      dbBookingCode = dbBookingCode.substring(0, 2) + "-" + dbBookingCode.substring(2)
    }

    this.logger.log(`Matched Booking Code: ${bookingCode} -> DB Query Code: ${dbBookingCode}`)

    // 2. Fetch the corresponding booking from the database using admin client
    const { data: booking, error: fetchError } = await this.supabase.admin
      .from("bookings")
      .select("*")
      .eq("booking_code", dbBookingCode)
      .maybeSingle()

    if (fetchError || !booking) {
      this.logger.error(`Booking not found for code: ${bookingCode}. Error: ${fetchError?.message}`)
      return { success: false, message: `Booking with code ${bookingCode} not found` }
    }

    // 3. Prevent duplicate processing (Idempotency)
    // Check if a payment with this transaction_id (or referenceCode) already exists
    const { data: existingPayment } = await this.supabase.admin
      .from("payments")
      .select("*")
      .or(`transaction_id.eq.${transactionId},transaction_id.eq.${referenceCode}`)
      .maybeSingle()

    if (existingPayment) {
      this.logger.log(`Transaction ${transactionId}/${referenceCode} was already processed. Skipping.`)
      return { success: true, message: "Transaction already processed" }
    }

    // 4. Calculate expected amounts
    const subtotal = booking.subtotal
    const platformFee = booking.platform_fee
    const pointsRedeemed = booking.points_redeemed || 0
    const totalAmount = booking.total_amount

    // Expected deposit: 20% room fee + 10% platform fee minus points discount
    const expectedDeposit = Math.max(0, Math.round(subtotal * 0.2 + platformFee) - pointsRedeemed)
    const expectedFull = totalAmount

    this.logger.log(
      `Booking ${booking.id}: Expected Deposit: ${expectedDeposit}, Expected Full: ${expectedFull}`
    )

    // Determine the payment status based on the transferred amount (with minor margin check)
    let paymentStatus: string
    if (transferAmount >= expectedFull - 10) {
      paymentStatus = "fully_paid"
    } else if (transferAmount >= expectedDeposit - 10) {
      paymentStatus = "deposited"
    } else {
      this.logger.warn(
        `Insufficient transfer amount. Got ${transferAmount}, expected at least ${expectedDeposit}`
      )
      // We still log the payment as pending or failed, but do not confirm the booking
      paymentStatus = "pending"
    }

    // 5. Update booking if the transfer amount is sufficient
    if (paymentStatus === "fully_paid" || paymentStatus === "deposited") {
      const { error: updateError } = await this.supabase.admin
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id)

      if (updateError) {
        this.logger.error(`Failed to update booking status: ${updateError.message}`)
        throw new Error(`Failed to update booking status: ${updateError.message}`)
      }

      this.logger.log(`Booking ${booking.id} status updated to CONFIRMED. Payment status: ${paymentStatus}`)
    }

    // 6. Insert record into payments table
    const { error: paymentError } = await this.supabase.admin
      .from("payments")
      .insert({
        booking_id: booking.id,
        payment_method: "vietqr",
        transaction_id: referenceCode || String(transactionId),
        amount: transferAmount,
        status: paymentStatus !== "pending" ? "successful" : "failed",
        paid_at: new Date().toISOString(),
      })

    if (paymentError) {
      this.logger.error(`Failed to record payment log: ${paymentError.message}`)
      throw new Error(`Failed to record payment log: ${paymentError.message}`)
    }

    this.logger.log(`Successfully recorded payment for booking ${booking.id}`)
    return { success: true }
  }
}
