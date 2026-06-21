import { Controller, Get, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { DashboardService } from "./dashboard.service"

@Controller("partner/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getDashboard(user.id)
  }
}
