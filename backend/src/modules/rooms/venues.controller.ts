import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { CreateRoomDto } from "./dto/create-room.dto"
import { CreateVenueDto } from "./dto/create-venue.dto"
import { UpdateVenueDto } from "./dto/update-venue.dto"
import { UpdateVenueStatusDto } from "./dto/update-venue-status.dto"
import { VenuesService } from "./venues.service"

@Controller("partner/venues")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier", "admin")
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.venuesService.findMine(user.id)
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateVenueDto) {
    console.log('📍 POST /partner/venues');
    console.log('User:', user);
    console.log('DTO:', dto);

    try {
      const result = await this.venuesService.create(user.id, dto);
      console.log('✅ Venue created:', result);
      return result;
    } catch (error) {
      console.error('❌ CREATE VENUE ERROR:', error);
      throw error;
    }
  }


  @Patch(":venueId/status")
  updateStatus(
    @Param("venueId") venueId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateVenueStatusDto,
  ) {
    return this.venuesService.updateStatus(venueId, user.id, dto.status)
  }

  @Patch(":venueId")
  update(
    @Param("venueId") venueId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venuesService.update(venueId, user.id, dto)
  }

  @Get(":venueId/rooms")
  findRooms(@Param("venueId") venueId: string, @CurrentUser() user: AuthUser) {
    return this.venuesService.findRooms(venueId, user.id)
  }

  @Post(":venueId/rooms")
  createRoom(
    @Param("venueId") venueId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRoomDto,
  ) {
    return this.venuesService.createRoom(venueId, user.id, dto)
  }
}
