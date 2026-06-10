import { Module } from "@nestjs/common"
import { DatabaseModule } from "../../database/database.module"
import { AuthModule } from "../auth/auth.module"
import { WishlistController } from "./wishlist.controller"
import { WishlistService } from "./wishlist.service"

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}