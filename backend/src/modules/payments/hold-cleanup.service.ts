import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common"
import { SupabaseService } from "../../database/supabase.service"

@Injectable()
export class HoldCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HoldCleanupService.name)
  private intervalId: NodeJS.Timeout | null = null

  constructor(private readonly supabase: SupabaseService) {}

  onModuleInit() {
    this.logger.log("HoldCleanupService initialized. Starting 1-minute interval hold cleanup...")
    // Run cleanup every minute
    this.intervalId = setInterval(() => {
      void this.cleanupExpiredHolds()
    }, 60000)
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  async cleanupExpiredHolds() {
    const expirationTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    try {
      const { data, error } = await this.supabase.admin
        .from("bookings")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("status", "pending")
        .lt("created_at", expirationTime)
        .select("id, booking_code")

      if (error) {
        this.logger.error(`Error cleaning up expired holds: ${error.message}`)
      } else if (data && data.length > 0) {
        data.forEach((booking) => {
          this.logger.log(`Auto-cancelled expired hold booking: ${booking.booking_code} (${booking.id})`)
        })
      }
    } catch (err: any) {
      this.logger.error(`Exception during expired holds cleanup: ${err.message || err}`)
    }
  }
}
