import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
