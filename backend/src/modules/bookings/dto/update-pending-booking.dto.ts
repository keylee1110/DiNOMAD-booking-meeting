import { IsInt, Min } from "class-validator"

export class UpdatePendingBookingDto {
  @IsInt()
  @Min(0)
  pointsRedeemed!: number
}
