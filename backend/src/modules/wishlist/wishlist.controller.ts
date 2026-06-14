import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { ToggleWishlistDto } from "./dto/toggle-wishlist.dto"
import { WishlistService } from "./wishlist.service"

@Controller("wishlists")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post("toggle")
  toggle(@CurrentUser() user: AuthUser, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggle(user.id, dto)
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.wishlistService.findAll(user.id)
  }
}