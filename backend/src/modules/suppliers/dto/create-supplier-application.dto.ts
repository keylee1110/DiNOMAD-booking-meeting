import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator"

export class CreateSupplierApplicationDto {
  @IsString()
  @MaxLength(160)
  legalName!: string

  @IsString()
  @MaxLength(120)
  displayName!: string

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
  @IsString()
  @MaxLength(1000)
  onboardingNote?: string
}

