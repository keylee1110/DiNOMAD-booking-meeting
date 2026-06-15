import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { EarningsController } from "./earnings.controller"
import { EarningsService } from "./earnings.service"
import { RoomsController } from "./rooms.controller"
import { RoomsService } from "./rooms.service"
import { ScannerController } from "./scanner.controller"
import { ScannerService } from "./scanner.service"
import { VenuesController } from "./venues.controller"
import { VenuesService } from "./venues.service"

@Module({
  imports: [AuthModule],
  controllers: [VenuesController, RoomsController, EarningsController, ScannerController],
  providers: [VenuesService, RoomsService, EarningsService, ScannerService],
  exports: [VenuesService, RoomsService],
})
export class RoomsModule {}
