import { IsBoolean, IsIn, IsOptional, IsUUID, Matches } from "class-validator"

export class CreateBookingDto {
  @IsUUID()
  roomId!: string

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string

  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be HH:MM" })
  startTime!: string

  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be HH:MM" })
  endTime!: string

  @IsIn(["deposit", "full"])
  paymentMode!: "deposit" | "full"

  @IsIn(["vietqr", "momo", "zalopay", "card"])
  paymentMethod!: "vietqr" | "momo" | "zalopay" | "card"

  @IsOptional()
  @IsBoolean()
  redeemPoints?: boolean
}
