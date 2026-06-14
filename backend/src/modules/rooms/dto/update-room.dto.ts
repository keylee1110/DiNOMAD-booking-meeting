import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator"

const AMENITY_VALUES = [
  "wifi", "tv", "whiteboard", "ac", "hdmi",
  "projector", "power_outlets", "coffee", "water", "parking", "printing",
]

const VIBE_TAG_VALUES = [
  "ultra_quiet", "discussion_friendly", "cold_ac",
  "natural_light", "cozy", "modern", "rooftop", "garden_view",
]

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number

  @IsOptional()
  @IsInt()
  @Min(10000)
  pricePerHour?: number

  @IsOptional()
  @IsIn(["team_hub", "solo_nook"])
  category?: "team_hub" | "solo_nook"

  @IsOptional()
  @IsArray()
  @IsIn(AMENITY_VALUES, { each: true })
  amenities?: string[]

  @IsOptional()
  @IsArray()
  @IsIn(VIBE_TAG_VALUES, { each: true })
  vibeTags?: string[]

  @IsOptional()
  @IsObject()
  specs?: Record<string, string>

  @IsOptional()
  @IsNumber()
  @Min(0)
  noiseLevel?: number
}
