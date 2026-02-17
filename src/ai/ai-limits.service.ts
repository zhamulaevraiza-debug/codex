import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AiRole, LimitType, UsagePeriod } from "@prisma/client";

type LimitConfig = {
  rpm: number;
  tpd: number;
};

type VoiceLimits = {
  ttsCharsPerDay: number;
  sttSecondsPerDay: number;
};

@Injectable()
export class AiLimitsService {
  private readonly llmLimits: LimitConfig = { rpm: 30, tpd: 100_000 };
  private readonly liveLimits: LimitConfig = { rpm: 60, tpd: 100_000 };
  private readonly voiceLimits: VoiceLimits = {
    ttsCharsPerDay: 30_000,
    sttSecondsPerDay: 60 * 60,
  };

  constructor(private readonly prisma: PrismaService) {}

  async assertLlmLimits(userId: string, role: AiRole, inputTokens: number) {
    const limits = await this.resolveLlmLimits(userId, role);
    const minuteKey = this.minuteKey();
    const dayKey = this.dayKey();

    const [minuteUsage, dayUsage] = await this.ensureUsage(userId, role, minuteKey, dayKey);

    if (minuteUsage.requests + 1 > limits.rpm) {
      await this.logLimit(userId, role, LimitType.RPM, limits.isSoft, "Rate limit exceeded (RPM)");
      if (!limits.isSoft) {
        throw new BadRequestException("Rate limit exceeded (RPM)");
      }
    }
    if (dayUsage.tokens + inputTokens > limits.tpd) {
      await this.logLimit(userId, role, LimitType.TPD, limits.isSoft, "Daily token limit exceeded");
      if (!limits.isSoft) {
        throw new BadRequestException("Daily token limit exceeded");
      }
    }
  }

  async recordLlmUsage(userId: string, role: AiRole, tokens: number) {
    const minuteKey = this.minuteKey();
    const dayKey = this.dayKey();
    await this.prisma.$transaction([
      this.prisma.aiUsage.update({
        where: { userId_role_period_periodKey: { userId, role, period: UsagePeriod.MINUTE, periodKey: minuteKey } },
        data: { requests: { increment: 1 }, tokens: { increment: tokens } },
      }),
      this.prisma.aiUsage.update({
        where: { userId_role_period_periodKey: { userId, role, period: UsagePeriod.DAY, periodKey: dayKey } },
        data: { requests: { increment: 1 }, tokens: { increment: tokens } },
      }),
    ]);
  }

  async assertTtsLimit(userId: string, chars: number) {
    const limit = await this.resolveVoiceLimit(userId, AiRole.TTS, LimitType.TTS_CHARS_DAILY, this.voiceLimits.ttsCharsPerDay);
    const dayKey = this.dayKey();
    const usage = await this.ensureSingle(userId, AiRole.TTS, UsagePeriod.DAY, dayKey);
    if (usage.ttsChars + chars > limit.limit) {
      await this.logLimit(userId, AiRole.TTS, LimitType.TTS_CHARS_DAILY, limit.isSoft, "Daily TTS character limit exceeded");
      if (!limit.isSoft) {
        throw new BadRequestException("Daily TTS character limit exceeded");
      }
    }
  }

  async recordTts(userId: string, chars: number) {
    const dayKey = this.dayKey();
    await this.prisma.aiUsage.update({
      where: { userId_role_period_periodKey: { userId, role: AiRole.TTS, period: UsagePeriod.DAY, periodKey: dayKey } },
      data: { requests: { increment: 1 }, ttsChars: { increment: chars } },
    });
  }

  async assertSttLimit(userId: string, seconds: number) {
    const limit = await this.resolveVoiceLimit(userId, AiRole.STT, LimitType.STT_SECONDS_DAILY, this.voiceLimits.sttSecondsPerDay);
    const dayKey = this.dayKey();
    const usage = await this.ensureSingle(userId, AiRole.STT, UsagePeriod.DAY, dayKey);
    if (usage.sttSeconds + seconds > limit.limit) {
      await this.logLimit(userId, AiRole.STT, LimitType.STT_SECONDS_DAILY, limit.isSoft, "Daily STT time limit exceeded");
      if (!limit.isSoft) {
        throw new BadRequestException("Daily STT time limit exceeded");
      }
    }
  }

  async recordStt(userId: string, seconds: number) {
    const dayKey = this.dayKey();
    await this.prisma.aiUsage.update({
      where: { userId_role_period_periodKey: { userId, role: AiRole.STT, period: UsagePeriod.DAY, periodKey: dayKey } },
      data: { requests: { increment: 1 }, sttSeconds: { increment: seconds } },
    });
  }

  private async ensureUsage(userId: string, role: AiRole, minuteKey: string, dayKey: string) {
    const minuteUsage = await this.prisma.aiUsage.upsert({
      where: {
        userId_role_period_periodKey: {
          userId,
          role,
          period: UsagePeriod.MINUTE,
          periodKey: minuteKey,
        },
      },
      update: {},
      create: { userId, role, period: UsagePeriod.MINUTE, periodKey: minuteKey },
    });
    const dayUsage = await this.prisma.aiUsage.upsert({
      where: {
        userId_role_period_periodKey: {
          userId,
          role,
          period: UsagePeriod.DAY,
          periodKey: dayKey,
        },
      },
      update: {},
      create: { userId, role, period: UsagePeriod.DAY, periodKey: dayKey },
    });
    return [minuteUsage, dayUsage];
  }

  private async ensureSingle(
    userId: string,
    role: AiRole,
    period: UsagePeriod,
    key: string,
  ) {
    return this.prisma.aiUsage.upsert({
      where: { userId_role_period_periodKey: { userId, role, period, periodKey: key } },
      update: {},
      create: { userId, role, period, periodKey: key },
    });
  }

  private minuteKey() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  private dayKey() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private async resolveLlmLimits(userId: string, role: AiRole) {
    const base = role === AiRole.LIVE_LLM ? this.liveLimits : this.llmLimits;
    const [rpmOverride, tpdOverride] = await Promise.all([
      this.findOverride(userId, role, LimitType.RPM),
      this.findOverride(userId, role, LimitType.TPD),
    ]);
    return {
      rpm: rpmOverride?.limit ?? base.rpm,
      tpd: tpdOverride?.limit ?? base.tpd,
      isSoft: rpmOverride?.isSoft ?? tpdOverride?.isSoft ?? false,
    };
  }

  private async resolveVoiceLimit(
    userId: string,
    role: AiRole,
    type: LimitType,
    baseLimit: number,
  ) {
    const override = await this.findOverride(userId, role, type);
    return {
      limit: override?.limit ?? baseLimit,
      isSoft: override?.isSoft ?? false,
    };
  }

  private async findOverride(userId: string, role: AiRole, type: LimitType) {
    const [userRole, userAllRoles, allUsersRole, global] = await this.prisma.$transaction([
      this.prisma.aiLimitOverride.findFirst({
        where: { userId, role, type },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.aiLimitOverride.findFirst({
        where: { userId, role: null, type },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.aiLimitOverride.findFirst({
        where: { userId: null, role, type },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.aiLimitOverride.findFirst({
        where: { userId: null, role: null, type },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return userRole ?? userAllRoles ?? allUsersRole ?? global ?? null;
  }

  private async logLimit(
    userId: string,
    role: AiRole,
    type: LimitType,
    isSoft: boolean,
    message: string,
  ) {
    await this.prisma.aiLimitEvent.create({
      data: { userId, role, type, isSoft, message },
    });
  }

  async getEffectiveLimits(userId: string) {
    const roles = [AiRole.PRIMARY_LLM, AiRole.TEST_LLM, AiRole.LIVE_LLM, AiRole.TTS, AiRole.STT];
    const results: Record<string, any> = {};
    for (const role of roles) {
      if (role === AiRole.TTS) {
        const tts = await this.resolveVoiceLimit(
          userId,
          AiRole.TTS,
          LimitType.TTS_CHARS_DAILY,
          this.voiceLimits.ttsCharsPerDay,
        );
        results[role] = { TTS_CHARS_DAILY: tts };
        continue;
      }
      if (role === AiRole.STT) {
        const stt = await this.resolveVoiceLimit(
          userId,
          AiRole.STT,
          LimitType.STT_SECONDS_DAILY,
          this.voiceLimits.sttSecondsPerDay,
        );
        results[role] = { STT_SECONDS_DAILY: stt };
        continue;
      }

      const llm = await this.resolveLlmLimits(userId, role);
      results[role] = {
        RPM: { limit: llm.rpm, isSoft: llm.isSoft },
        TPD: { limit: llm.tpd, isSoft: llm.isSoft },
      };
    }
    return results;
  }

  getDefaultLimits() {
    return {
      PRIMARY_LLM: { RPM: this.llmLimits.rpm, TPD: this.llmLimits.tpd },
      TEST_LLM: { RPM: this.llmLimits.rpm, TPD: this.llmLimits.tpd },
      LIVE_LLM: { RPM: this.liveLimits.rpm, TPD: this.liveLimits.tpd },
      TTS: { TTS_CHARS_DAILY: this.voiceLimits.ttsCharsPerDay },
      STT: { STT_SECONDS_DAILY: this.voiceLimits.sttSecondsPerDay },
    };
  }

  async getUsageSnapshot(userId: string) {
    const dayKey = this.dayKey();
    const minuteKey = this.minuteKey();

    const [dayUsage, minuteUsage] = await this.prisma.$transaction([
      this.prisma.aiUsage.findMany({
        where: { userId, period: UsagePeriod.DAY, periodKey: dayKey },
      }),
      this.prisma.aiUsage.findMany({
        where: { userId, period: UsagePeriod.MINUTE, periodKey: minuteKey },
      }),
    ]);

    const dayMap = new Map(dayUsage.map((u) => [u.role, u]));
    const minuteMap = new Map(minuteUsage.map((u) => [u.role, u]));

    return {
      dayKey,
      minuteKey,
      day: Object.fromEntries(
        Array.from(dayMap.entries()).map(([role, u]) => [
          role,
          {
            requests: u.requests,
            tokens: u.tokens,
            ttsChars: u.ttsChars,
            sttSeconds: u.sttSeconds,
          },
        ]),
      ),
      minute: Object.fromEntries(
        Array.from(minuteMap.entries()).map(([role, u]) => [
          role,
          {
            requests: u.requests,
            tokens: u.tokens,
          },
        ]),
      ),
    };
  }

  async getRemainingLimits(userId: string) {
    const limits = await this.getEffectiveLimits(userId);
    const usage = await this.getUsageSnapshot(userId);
    const usageErrors = await this.getUsageErrors(userId);

    const remaining: Record<string, any> = {};
    for (const role of Object.keys(limits)) {
      const roleLimits = limits[role];
      const day = usage.day[role] ?? { requests: 0, tokens: 0, ttsChars: 0, sttSeconds: 0 };
      const minute = usage.minute[role] ?? { requests: 0, tokens: 0 };

      if (role === AiRole.TTS) {
        const limit = roleLimits.TTS_CHARS_DAILY.limit ?? roleLimits.TTS_CHARS_DAILY;
        remaining[role] = {
          TTS_CHARS_DAILY: Math.max(0, limit - day.ttsChars),
        };
        continue;
      }
      if (role === AiRole.STT) {
        const limit = roleLimits.STT_SECONDS_DAILY.limit ?? roleLimits.STT_SECONDS_DAILY;
        remaining[role] = {
          STT_SECONDS_DAILY: Math.max(0, limit - day.sttSeconds),
        };
        continue;
      }

      const rpmLimit = roleLimits.RPM.limit ?? roleLimits.RPM;
      const tpdLimit = roleLimits.TPD.limit ?? roleLimits.TPD;
      remaining[role] = {
        RPM: Math.max(0, rpmLimit - minute.requests),
        TPD: Math.max(0, tpdLimit - day.tokens),
      };
    }

    return { limits, usage, remaining, usageErrors };
  }

  private async getUsageErrors(userId: string) {
    const start = this.startOfUtcDay();
    const [limitEvents, requestErrors] = await this.prisma.$transaction([
      this.prisma.aiLimitEvent.count({
        where: { userId, createdAt: { gte: start } },
      }),
      this.prisma.aiRequestLog.count({
        where: { userId, createdAt: { gte: start }, success: false },
      }),
    ]);
    return { limitEvents, requestErrors };
  }

  private startOfUtcDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  }
}
