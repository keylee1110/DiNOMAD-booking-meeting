import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../../common/decorators/roles.decorator"
import { BookingsService } from "./bookings.service"
import { UpdatePendingBookingDto } from "./dto/update-pending-booking.dto"
import { CreateBookingHoldDto } from "./dto/create-booking-hold.dto"

@Controller("bookings")
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post("hold")
  createHold(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingHoldDto) {
    return this.bookingsService.createHold(user.id, dto)
  }

  @Get("admin/all")
  @Roles("admin")
  @UseGuards(RolesGuard)
  findAllForAdmin() {
    return this.bookingsService.findAllForAdmin()
  }

  @Patch(":id/cancel-pending")
  cancelPending(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.bookingsService.cancelPending(id, user.id)
  }

  @Patch(":id/pending")
  updatePending(@Param("id") id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePendingBookingDto) {
    return this.bookingsService.updatePending(id, user.id, dto)
  }
}
