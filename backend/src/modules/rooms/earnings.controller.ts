import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { EarningsService } from "./earnings.service"

@Controller("partner/earnings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get()
  getEarnings(
    @CurrentUser() user: AuthUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    // Default: current calendar month
    const now = new Date()
    const defaultStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`
    const defaultEnd = now.toISOString().slice(0, 10)

    return this.earningsService.getEarnings(
      user.id,
      startDate ?? defaultStart,
      endDate ?? defaultEnd,
    )
  }
}
