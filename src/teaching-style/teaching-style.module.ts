import { Module } from "@nestjs/common";
import { TeachingStyleService } from "./teaching-style.service";
import { TeachingStyleController } from "./teaching-style.controller";

@Module({
  providers: [TeachingStyleService],
  controllers: [TeachingStyleController],
  exports: [TeachingStyleService],
})
export class TeachingStyleModule {}
