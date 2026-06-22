import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { PartnerBookingsService } from "./partner-bookings.service"

@Controller("partner/bookings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class PartnerBookingsController {
  constructor(private readonly partnerBookingsService: PartnerBookingsService) {}

  /** List bookings for a given date (defaults to today) filtered by optional status */
  @Get()
  listBookings(
    @CurrentUser() user: AuthUser,
    @Query("date") date?: string,
    @Query("status") status?: string,
  ) {
    const targetDate = date ?? new Date().toISOString().slice(0, 10)
    return this.partnerBookingsService.listBookings(user.id, targetDate, status)
  }

  /** Update booking status (confirm / arriving / checked_in / completed / cancelled) */
  @Patch(":bookingId/status")
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param("bookingId") bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.partnerBookingsService.updateStatus(user.id, bookingId, body.status as any)
  }
}
