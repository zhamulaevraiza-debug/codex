import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LogoutDto } from "./dto/logout.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @Throttle({ public: { limit: 5, ttl: 60 } })
  @ApiResponse({ status: 201, description: "User registered" })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @Throttle({ public: { limit: 10, ttl: 60 } })
  @ApiResponse({ status: 200, description: "User logged in" })
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @ApiResponse({ status: 200, description: "Tokens refreshed" })
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  @ApiResponse({ status: 200, description: "Logged out" })
  async logout(@Body() dto: LogoutDto) {
    await this.auth.logout(dto.refreshToken);
    return { ok: true };
  }
}
