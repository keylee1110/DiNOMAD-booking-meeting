import { Module } from "@nestjs/common"
import { AuthModule } from "../auth/auth.module"
import { DashboardController } from "./dashboard.controller"
import { DashboardService } from "./dashboard.service"
import { EarningsController } from "./earnings.controller"
import { EarningsService } from "./earnings.service"
import { PartnerBookingsController } from "./partner-bookings.controller"
import { PartnerBookingsService } from "./partner-bookings.service"
import { RoomsController } from "./rooms.controller"
import { RoomsService } from "./rooms.service"
import { ScannerController } from "./scanner.controller"
import { ScannerService } from "./scanner.service"
import { VenuesController } from "./venues.controller"
import { VenuesService } from "./venues.service"

@Module({
  imports: [AuthModule],
  controllers: [
    VenuesController,
    RoomsController,
    EarningsController,
    ScannerController,
    DashboardController,
    PartnerBookingsController,
  ],
  providers: [
    VenuesService,
    RoomsService,
    EarningsService,
    ScannerService,
    DashboardService,
    PartnerBookingsService,
  ],
  exports: [VenuesService, RoomsService],
})
export class RoomsModule {}

