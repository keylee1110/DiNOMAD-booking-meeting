import { IsNumber, IsOptional, IsString, Matches, MaxLength } from "class-validator"

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  district?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsNumber()
  lat?: number

  @IsOptional()
  @IsNumber()
  lng?: number

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "openTime must be HH:MM" })
  openTime?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "closeTime must be HH:MM" })
  closeTime?: string
}
