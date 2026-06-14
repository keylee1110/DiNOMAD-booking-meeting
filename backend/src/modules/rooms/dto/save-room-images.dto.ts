import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from "class-validator"

export class SaveRoomImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  urls!: string[]
}
