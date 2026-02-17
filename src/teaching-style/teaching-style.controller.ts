import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { TeachingStyleService } from "./teaching-style.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

@Controller("teaching-style")
@UseGuards(JwtAuthGuard)
export class TeachingStyleController {
  constructor(private readonly service: TeachingStyleService) {}

  @Get("default")
  getDefault() {
    return this.service.getDefault();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Get()
  listAll() {
    return this.service.listAll();
  }
}
