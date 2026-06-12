import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator"

export class CreateVenueDto {
  @IsString()
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nameVi?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  descriptionVi?: string

  @IsString()
  address!: string

  @IsOptional()
  @IsString()
  addressVi?: string

  @IsString()
  district!: string

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
}
