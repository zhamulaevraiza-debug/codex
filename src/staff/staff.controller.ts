import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { StaffService } from "./staff.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";

@ApiTags("staff")
@ApiBearerAuth()
@Controller("staff")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiQuery({ name: "role", enum: Role, required: false })
  @ApiResponse({ status: 200, description: "List staff users" })
  async list(@Query("role") role?: Role) {
    return this.staff.list(role);
  }

  @Post()
  @ApiResponse({ status: 201, description: "Create staff user" })
  async create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Patch(":id")
  @ApiResponse({ status: 200, description: "Update staff user" })
  async update(@Param("id") id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, dto);
  }
}
