import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { RoomsController } from "./rooms.controller"
import { RoomsService } from "./rooms.service"
import { VenuesController } from "./venues.controller"
import { VenuesService } from "./venues.service"

@Module({
  imports: [AuthModule],
  controllers: [VenuesController, RoomsController],
  providers: [VenuesService, RoomsService],
  exports: [VenuesService, RoomsService],
})
export class RoomsModule {}
