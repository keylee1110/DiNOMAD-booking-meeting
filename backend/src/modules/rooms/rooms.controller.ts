import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { SaveRoomImagesDto } from "./dto/save-room-images.dto"
import { UpdateRoomDto } from "./dto/update-room.dto"
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto"
import { UpdateSlotsDto } from "./dto/update-slots.dto"
import { RoomsService } from "./rooms.service"

@Controller("partner/rooms")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get(":roomId/slots")
  getSlots(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Query("date") date: string,
  ) {
    const targetDate = date ?? new Date().toISOString().slice(0, 10)
    return this.roomsService.getSlots(roomId, user.id, targetDate)
  }

  @Patch(":roomId/slots")
  updateSlots(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSlotsDto,
  ) {
    return this.roomsService.updateSlots(roomId, user.id, dto)
  }

  @Post(":roomId/images")
  saveImages(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveRoomImagesDto,
  ) {
    return this.roomsService.saveImages(roomId, user.id, dto.urls)
  }

  @Delete(":roomId/images/:imageId")
  deleteImage(
    @Param("roomId") roomId: string,
    @Param("imageId") imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.roomsService.deleteImage(imageId, roomId, user.id)
  }

  @Patch(":roomId")
  update(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(roomId, user.id, dto)
  }

  @Patch(":roomId/status")
  updateStatus(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomsService.updateStatus(roomId, user.id, dto)
  }

  @Delete(":roomId")
  archive(@Param("roomId") roomId: string, @CurrentUser() user: AuthUser) {
    return this.roomsService.archive(roomId, user.id)
  }
}
