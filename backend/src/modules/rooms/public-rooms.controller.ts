import { Controller, Get, Param, Query } from "@nestjs/common"
import { PublicRoomsService } from "./public-rooms.service"
import { RoomsService } from "./rooms.service"

@Controller("rooms")
export class PublicRoomsController {
  constructor(
    private readonly publicRoomsService: PublicRoomsService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get()
  search(
    @Query("query") query?: string,
    @Query("district") district?: string,
    @Query("minCapacity") minCapacity?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("amenities") amenities?: string,
    @Query("vibeTags") vibeTags?: string,
    @Query("category") category?: string,
    @Query("verified") verified?: string,
    @Query("noiseLevelMin") noiseLevelMin?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.publicRoomsService.search({
      query,
      district,
      minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      amenities: amenities ? amenities.split(",").filter(Boolean) : undefined,
      vibeTags: vibeTags ? vibeTags.split(",").filter(Boolean) : undefined,
      category,
      verified: verified === "true" ? true : undefined,
      noiseLevelMin: noiseLevelMin ? parseInt(noiseLevelMin, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    })
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.publicRoomsService.getById(id)
  }

  @Get(":roomId/slots")
  getPublicSlots(@Param("roomId") roomId: string, @Query("date") date: string) {
    const targetDate = date ?? new Date().toISOString().slice(0, 10)
    return this.roomsService.getPublicSlots(roomId, targetDate)
  }
}
