import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { RolesGuard } from "../auth/roles.guard";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  providers: [AdminService, RolesGuard],
  controllers: [AdminController],
})
export class AdminModule {}
