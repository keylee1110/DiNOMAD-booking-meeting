import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from "class-validator"

export class RedeemPointDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string

  @IsInt()
  @Min(1)
  pointsToRedeem!: number

  @IsNumber()
  @Min(0)
  bookingTotal!: number
}
