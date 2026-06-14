import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator"

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string

  @IsUUID()
  @IsNotEmpty()
  bookingId!: string

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating!: number

  @IsString()
  @IsOptional()
  comment?: string
}