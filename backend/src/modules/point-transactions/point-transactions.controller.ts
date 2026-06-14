import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CreatePointTransactionDto } from "./dto/create-point-transaction.dto"
import { RedeemPointDto } from "./dto/redeem-point.dto"
import { PointTransactionsService } from "./point-transactions.service"

@Controller("point-transactions")
@UseGuards(JwtAuthGuard)
export class PointTransactionsController {
  constructor(private readonly pointTransactionsService: PointTransactionsService) {}

  // API tạo giao dịch điểm thông thường (Earn điểm khi hoàn thành / Refund điểm khi hủy đơn)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePointTransactionDto) {
    return this.pointTransactionsService.create(user.id, dto)
  }

  // API áp dụng tiêu điểm giảm giá lúc Checkout (Có check luật >= 5 điểm và max 50% đơn hàng)
  @Post("redeem")
  redeem(@CurrentUser() user: AuthUser, @Body() dto: RedeemPointDto) {
    return this.pointTransactionsService.redeemPoints(
      user.id,
      dto.bookingId,
      dto.pointsToRedeem,
      dto.bookingTotal
    )
  }

  // API lấy toàn bộ lịch sử biến động điểm thưởng của User
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.pointTransactionsService.findAll(user.id)
  }

  // API lấy tổng số điểm khả dụng hiện tại của User
  @Get("balance")
  getBalance(@CurrentUser() user: AuthUser) {
    return this.pointTransactionsService.getBalance(user.id)
  }
}