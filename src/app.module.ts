import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { APP_GUARD } from "@nestjs/core";
import { CommonModule } from "./common/common.module";
import { throttlerConfig } from "./common/throttle";
import { AuthModule } from "./auth/auth.module";
import { StaffModule } from "./staff/staff.module";
import { OrdersModule } from "./orders/orders.module";
import { CashModule } from "./cash/cash.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    CommonModule,
    AuthModule,
    StaffModule,
    OrdersModule,
    CashModule,
    ReportsModule,
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
