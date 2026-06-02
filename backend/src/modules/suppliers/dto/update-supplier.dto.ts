import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator"

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  taxCode?: string

  @IsOptional()
  @IsEmail()
  businessEmail?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  businessPhone?: string

  @IsOptional()
  @IsIn(["pending", "approved", "rejected", "suspended"])
  status?: "pending" | "approved" | "rejected" | "suspended"
}

