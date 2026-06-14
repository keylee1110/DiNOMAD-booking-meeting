import { IsIn } from "class-validator"

export class UpdateRoomStatusDto {
  @IsIn(["published", "unavailable", "archived"])
  status!: "published" | "unavailable" | "archived"
}
