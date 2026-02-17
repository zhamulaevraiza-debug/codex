import { Module } from "@nestjs/common";
import { AiKeysService } from "./ai-keys.service";
import { AiConfigService } from "./ai-config.service";
import { AiAdapterService } from "./ai-adapter.service";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { AiVoiceService } from "./ai-voice.service";
import { AiLimitsService } from "./ai-limits.service";
import { AiAuditService } from "./ai-audit.service";
import { AiHealthService } from "./ai-health.service";

@Module({
  providers: [
    AiKeysService,
    AiConfigService,
    AiAdapterService,
    AiService,
    AiVoiceService,
    AiLimitsService,
    AiAuditService,
    AiHealthService,
  ],
  controllers: [AiController],
  exports: [AiLimitsService, AiAuditService],
})
export class AiModule {}
