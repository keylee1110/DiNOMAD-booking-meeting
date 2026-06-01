import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Roles } from "../../common/decorators/roles.decorator"
import type { AuthUser } from "../../common/types/auth-user"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { CreateSupplierApplicationDto } from "./dto/create-supplier-application.dto"
import { UpdateSupplierDto } from "./dto/update-supplier.dto"
import { SuppliersService } from "./suppliers.service"

@Controller("suppliers")
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get("me")
  findMine(@CurrentUser() user: AuthUser) {
    return this.suppliersService.findMine(user.id)
  }

  @Post("applications")
  submitApplication(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSupplierApplicationDto,
  ) {
    return this.suppliersService.submitApplication(user.id, dto)
  }

  @Get()
  @Roles("admin")
  @UseGuards(RolesGuard)
  findAll() {
    return this.suppliersService.findAll()
  }

  @Get(":id")
  @Roles("admin", "supplier")
  @UseGuards(RolesGuard)
  findById(@Param("id") id: string) {
    return this.suppliersService.findById(id)
  }

  @Patch(":id")
  @Roles("admin")
  @UseGuards(RolesGuard)
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto, user.id)
  }
}

