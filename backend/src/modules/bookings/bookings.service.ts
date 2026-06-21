import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"

@Injectable()
export class BookingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async cancelPending(bookingId: string, customerId: string) {
    // 1. Fetch booking to verify ownership and state
    const { data: booking, error: fetchErr } = await this.supabase.admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (fetchErr || !booking) {
      throw new NotFoundException("Booking not found")
    }

    if (booking.customer_id !== customerId) {
      throw new BadRequestException("Unauthorized to modify this booking")
    }

    if (booking.status !== "pending") {
      throw new BadRequestException(`Cannot cancel booking in status: ${booking.status}`)
    }

    // 2. Update status to cancelled
    const { error: updateErr } = await this.supabase.admin
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    if (updateErr) {
      throw new Error(`Failed to cancel booking: ${updateErr.message}`)
    }

    return { success: true, message: "Booking cancelled successfully" }
  }
}
