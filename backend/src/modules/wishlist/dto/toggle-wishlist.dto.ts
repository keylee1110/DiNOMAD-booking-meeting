import { IsNotEmpty, IsUUID } from "class-validator"

export class ToggleWishlistDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string
}