import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { PublicRoomsController } from "./public-rooms.controller"
import { PublicRoomsService } from "./public-rooms.service"
import { RoomsController } from "./rooms.controller"
import { RoomsService } from "./rooms.service"
import { VenuesController } from "./venues.controller"
import { VenuesService } from "./venues.service"

@Module({
  imports: [AuthModule],
  controllers: [VenuesController, RoomsController, PublicRoomsController],
  providers: [VenuesService, RoomsService, PublicRoomsService],
  exports: [VenuesService, RoomsService],
})
export class RoomsModule {}
