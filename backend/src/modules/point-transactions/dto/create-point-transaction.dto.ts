import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator"

export class CreatePointTransactionDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  amount!: number

  @IsString()
  @IsIn(["earn", "redeem", "refund"]) // Bổ sung thêm refund khi khách hủy phòng
  @IsNotEmpty()
  type!: "earn" | "redeem" | "refund"

  @IsUUID()
  @IsOptional()
  bookingId?: string

  @IsString()
  @IsOptional()
  description?: string
}