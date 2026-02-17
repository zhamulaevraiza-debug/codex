import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UpdateProfileDto } from "./dto/profile.dto";
import { UpdateSettingsDto } from "./dto/settings.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiResponse({ status: 200, description: "Current user profile" })
  async me(@Req() req: { user: { userId: string } }) {
    return this.users.getMe(req.user.userId);
  }

  @Patch("me/profile")
  @ApiResponse({ status: 200, description: "Profile updated" })
  async updateProfile(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @Patch("me/settings")
  @ApiResponse({ status: 200, description: "Settings updated" })
  async updateSettings(
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.users.updateSettings(req.user.userId, dto);
  }
}
