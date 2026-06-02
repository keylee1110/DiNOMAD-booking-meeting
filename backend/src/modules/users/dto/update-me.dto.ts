import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator"

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsUrl()
  avatarUrl?: string
}

