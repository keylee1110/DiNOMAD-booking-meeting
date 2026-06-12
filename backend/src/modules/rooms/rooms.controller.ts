import { Body, Controller, Delete, Param, Patch, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { UpdateRoomDto } from "./dto/update-room.dto"
import { UpdateRoomStatusDto } from "./dto/update-room-status.dto"
import { RoomsService } from "./rooms.service"

@Controller("partner/rooms")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

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
