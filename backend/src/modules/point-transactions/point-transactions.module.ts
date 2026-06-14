import { Module } from "@nestjs/common"
import { DatabaseModule } from "../../database/database.module"
import { AuthModule } from "../auth/auth.module"
import { PointTransactionsController } from "./point-transactions.controller"
import { PointTransactionsService } from "./point-transactions.service"

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PointTransactionsController],
  providers: [PointTransactionsService],
})
export class PointTransactionsModule {}