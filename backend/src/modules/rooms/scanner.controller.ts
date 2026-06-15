import { Controller, Get, Patch, Param, Query, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { ScannerService } from "./scanner.service"

@Controller("partner/scanner")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  /** Look up a booking by booking code */
  @Get("lookup")
  lookup(
    @CurrentUser() user: AuthUser,
    @Query("bookingCode") bookingCode: string,
  ) {
    return this.scannerService.lookup(user.id, bookingCode)
  }

  /** Mark guest as checked in */
  @Patch(":bookingId/checkin")
  checkIn(
    @CurrentUser() user: AuthUser,
    @Param("bookingId") bookingId: string,
  ) {
    return this.scannerService.checkIn(user.id, bookingId)
  }

  /** Mark booking as no-show */
  @Patch(":bookingId/no-show")
  markNoShow(
    @CurrentUser() user: AuthUser,
    @Param("bookingId") bookingId: string,
  ) {
    return this.scannerService.markNoShow(user.id, bookingId)
  }
}
