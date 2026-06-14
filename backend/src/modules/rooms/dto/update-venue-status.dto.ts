import { IsIn } from "class-validator"

export class UpdateVenueStatusDto {
  @IsIn(["published", "draft", "suspended"])
  status!: "published" | "draft" | "suspended"
}
