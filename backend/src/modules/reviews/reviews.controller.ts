import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CreateReviewDto } from "./dto/create-review.dto"
import { ReviewsService } from "./reviews.service"

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthUser, 
    @Body() dto: CreateReviewDto
  ) {
    return this.reviewsService.create(user.id, dto)
  }

  @Get("room/:roomId")
  findByRoomId(@Param("roomId") roomId: string) {
    return this.reviewsService.findByRoomId(roomId)
  }

  @Get("booking/:bookingId")
  @UseGuards(JwtAuthGuard)
  findByBookingId(@Param("bookingId") bookingId: string) {
    return this.reviewsService.findByBookingId(bookingId)
  }
}