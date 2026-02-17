import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { APP_GUARD } from "@nestjs/core";
import { CommonModule } from "./common/common.module";
import { throttlerConfig } from "./common/throttle";
import { AuthModule } from "./auth/auth.module";
import { EducationModule } from "./education/education.module";
import { AdminModule } from "./admin/admin.module";
import { UsersModule } from "./users/users.module";
import { TeachingStyleModule } from "./teaching-style/teaching-style.module";
import { AiModule } from "./ai/ai.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    CommonModule,
    AuthModule,
    EducationModule,
    AdminModule,
    UsersModule,
    TeachingStyleModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
