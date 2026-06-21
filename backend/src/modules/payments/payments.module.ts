import { Module } from "@nestjs/common"
import { DatabaseModule } from "../../database/database.module"
import { PaymentsController } from "./payments.controller"
import { PaymentsService } from "./payments.service"
import { HoldCleanupService } from "./hold-cleanup.service"

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, HoldCleanupService],
})
export class PaymentsModule {}
