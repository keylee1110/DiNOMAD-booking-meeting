import { IsDateString, IsInt, IsString, IsUUID, Matches, Min } from "class-validator"

export class CreateBookingHoldDto {
  @IsUUID()
  roomId!: string

  @IsDateString()
  date!: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string

  @IsInt()
  @Min(0)
  pointsRedeemed!: number
}
