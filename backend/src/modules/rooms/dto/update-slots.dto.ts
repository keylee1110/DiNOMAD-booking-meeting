import { IsArray, IsDateString, IsIn, IsString, Matches } from "class-validator"

export class UpdateSlotsDto {
  @IsDateString()
  date!: string          // "YYYY-MM-DD"

  @IsArray()
  @IsString({ each: true })
  @Matches(/^\d{2}:\d{2}$/, { each: true, message: "Each startTime must be HH:MM" })
  startTimes!: string[]  // ["09:00", "09:30"]

  @IsIn(["available", "blocked"])
  status!: "available" | "blocked"
}
