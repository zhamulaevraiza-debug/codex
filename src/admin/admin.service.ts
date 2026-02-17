import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { SectionCreateDto, SectionUpdateDto } from "./dto/section.dto";
import { LessonCreateDto, LessonUpdateDto } from "./dto/lesson.dto";
import { CardCreateDto, CardUpdateDto } from "./dto/card.dto";
import { QuizCreateDto, QuizUpdateDto } from "./dto/quiz.dto";
import { TeachingStyleCreateDto, TeachingStyleUpdateDto } from "../teaching-style/dto/teaching-style.dto";
import { AiLimitCreateDto, AiLimitUpdateDto } from "./dto/ai-limits.dto";
import { AiLimitsService } from "../ai/ai-limits.service";
import { AiRole, LimitType, UsagePeriod } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limits: AiLimitsService,
  ) {}

  createSection(dto: SectionCreateDto) {
    return this.prisma.section.create({ data: dto });
  }

  updateSection(id: string, dto: SectionUpdateDto) {
    return this.prisma.section.update({ where: { id }, data: dto });
  }

  deleteSection(id: string) {
    return this.prisma.section.delete({ where: { id } });
  }

  createLesson(dto: LessonCreateDto) {
    return this.prisma.lesson.create({ data: dto });
  }

  updateLesson(id: string, dto: LessonUpdateDto) {
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  deleteLesson(id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  createCard(dto: CardCreateDto) {
    return this.prisma.card.create({ data: dto });
  }

  updateCard(id: string, dto: CardUpdateDto) {
    return this.prisma.card.update({ where: { id }, data: dto });
  }

  deleteCard(id: string) {
    return this.prisma.card.delete({ where: { id } });
  }

  createQuiz(dto: QuizCreateDto) {
    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        type: dto.type,
        question: dto.question,
        explanation: dto.explanation,
        options: {
          create: dto.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        },
      },
      include: { options: true },
    });
  }

  updateQuiz(id: string, dto: QuizUpdateDto) {
    return this.prisma.quiz.update({
      where: { id },
      data: {
        type: dto.type,
        question: dto.question,
        explanation: dto.explanation,
        options: dto.options
          ? {
              deleteMany: {},
              create: dto.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

  deleteQuiz(id: string) {
    return this.prisma.quiz.delete({ where: { id } });
  }

  createTeachingStyle(dto: TeachingStyleCreateDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.teachingStyle.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.teachingStyle.create({ data: dto });
    });
  }

  updateTeachingStyle(id: string, dto: TeachingStyleUpdateDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.teachingStyle.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.teachingStyle.update({ where: { id }, data: dto });
    });
  }

  deleteTeachingStyle(id: string) {
    return this.prisma.teachingStyle.delete({ where: { id } });
  }

  createAiLimit(dto: AiLimitCreateDto) {
    return this.prisma.aiLimitOverride.create({
      data: {
        userId: dto.userId,
        role: dto.role,
        type: dto.type,
        limit: dto.limit,
        isSoft: dto.isSoft ?? false,
        note: dto.note,
      },
    });
  }

  updateAiLimit(id: string, dto: AiLimitUpdateDto) {
    return this.prisma.aiLimitOverride.update({
      where: { id },
      data: {
        role: dto.role,
        type: dto.type,
        limit: dto.limit,
        isSoft: dto.isSoft,
        note: dto.note,
      },
    });
  }

  deleteAiLimit(id: string) {
    return this.prisma.aiLimitOverride.delete({ where: { id } });
  }

  listAiLimits() {
    return this.prisma.aiLimitOverride.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  listAiLimitEvents(filters?: {
    userId?: string;
    role?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.aiLimitEvent.findMany({
      where: {
        userId: filters?.userId,
        role: filters?.role as any,
        type: filters?.type as any,
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 200,
      skip: filters?.offset ?? 0,
    });
  }

  getAiLimitConfig() {
    return {
      roles: Object.values(AiRole),
      types: Object.values(LimitType),
      defaults: this.limits.getDefaultLimits(),
      presets: [
        {
          name: "Starter",
          limits: {
            PRIMARY_LLM: { RPM: 10, TPD: 20000 },
            TEST_LLM: { RPM: 10, TPD: 20000 },
            LIVE_LLM: { RPM: 20, TPD: 20000 },
            TTS: { TTS_CHARS_DAILY: 5000 },
            STT: { STT_SECONDS_DAILY: 600 },
          },
        },
        {
          name: "Standard",
          limits: {
            PRIMARY_LLM: { RPM: 30, TPD: 100000 },
            TEST_LLM: { RPM: 30, TPD: 100000 },
            LIVE_LLM: { RPM: 60, TPD: 100000 },
            TTS: { TTS_CHARS_DAILY: 30000 },
            STT: { STT_SECONDS_DAILY: 3600 },
          },
        },
        {
          name: "Pro",
          limits: {
            PRIMARY_LLM: { RPM: 60, TPD: 250000 },
            TEST_LLM: { RPM: 60, TPD: 250000 },
            LIVE_LLM: { RPM: 120, TPD: 250000 },
            TTS: { TTS_CHARS_DAILY: 100000 },
            STT: { STT_SECONDS_DAILY: 14400 },
          },
        },
      ],
    };
  }

  async applyPreset(dto: { preset: string; userId?: string; role?: AiRole; isSoft?: boolean }) {
    const config = this.getAiLimitConfig();
    const preset = config.presets.find((p) => p.name.toLowerCase() === dto.preset.toLowerCase());
    if (!preset) {
      throw new BadRequestException("Preset not found");
    }

    const entries: Array<{
      role: AiRole;
      type: LimitType;
      limit: number;
    }> = [];

    const targetRoles = dto.role ? [dto.role] : (Object.keys(preset.limits) as AiRole[]);
    for (const role of targetRoles) {
      const limits = (preset.limits as any)[role];
      if (!limits) continue;
      if (limits.RPM) entries.push({ role, type: LimitType.RPM, limit: limits.RPM });
      if (limits.TPD) entries.push({ role, type: LimitType.TPD, limit: limits.TPD });
      if (limits.TTS_CHARS_DAILY)
        entries.push({ role, type: LimitType.TTS_CHARS_DAILY, limit: limits.TTS_CHARS_DAILY });
      if (limits.STT_SECONDS_DAILY)
        entries.push({ role, type: LimitType.STT_SECONDS_DAILY, limit: limits.STT_SECONDS_DAILY });
    }

    const created = await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.aiLimitOverride.create({
          data: {
            userId: dto.userId,
            role: entry.role,
            type: entry.type,
            limit: entry.limit,
            isSoft: dto.isSoft ?? false,
            note: `preset:${preset.name}`,
          },
        }),
      ),
    );
    return { applied: created.length };
  }

  async getAiUsageSummary(filters?: { userId?: string }) {
    const start = this.startOfUtcDay();
    const whereUser = filters?.userId ? { userId: filters.userId } : undefined;

    const [usageRows, limitEventsCount, requestErrorsCount] = await this.prisma.$transaction([
      this.prisma.aiUsage.findMany({
        where: {
          period: UsagePeriod.DAY,
          periodKey: this.dayKey(),
          ...(whereUser ?? {}),
        },
      }),
      this.prisma.aiLimitEvent.count({
        where: {
          createdAt: { gte: start },
          ...(whereUser ?? {}),
        },
      }),
      this.prisma.aiRequestLog.count({
        where: {
          createdAt: { gte: start },
          success: false,
          ...(whereUser ?? {}),
        },
      }),
    ]);

    const totals = usageRows.reduce(
      (acc, row) => {
        acc.tokens += row.tokens;
        acc.ttsChars += row.ttsChars;
        acc.sttSeconds += row.sttSeconds;
        acc.requests += row.requests;
        return acc;
      },
      { tokens: 0, ttsChars: 0, sttSeconds: 0, requests: 0 },
    );

    const byRole: Record<string, any> = {};
    for (const row of usageRows) {
      byRole[row.role] = {
        requests: row.requests,
        tokens: row.tokens,
        ttsChars: row.ttsChars,
        sttSeconds: row.sttSeconds,
      };
    }

    return {
      dayKey: this.dayKey(),
      totals,
      byRole,
      errors: {
        limitEvents: limitEventsCount,
        requestErrors: requestErrorsCount,
      },
    };
  }

  async listAiRequestLogs(filters?: {
    userId?: string;
    provider?: string;
    role?: string;
    type?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.aiRequestLog.findMany({
      where: {
        userId: filters?.userId,
        provider: filters?.provider as any,
        role: filters?.role as any,
        type: filters?.type as any,
        createdAt: {
          gte: filters?.from ? new Date(filters.from) : undefined,
          lte: filters?.to ? new Date(filters.to) : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 200,
      skip: filters?.offset ?? 0,
    });
  }

  async exportAiRequestLogsCsv(filters?: {
    userId?: string;
    provider?: string;
    role?: string;
    type?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const rows = await this.listAiRequestLogs(filters);
    const header = [
      "id",
      "userId",
      "role",
      "provider",
      "type",
      "model",
      "requestChars",
      "responseChars",
      "tokens",
      "durationSeconds",
      "isStream",
      "success",
      "errorMessage",
      "createdAt",
    ];
    const data = rows.map((r) => [
      r.id,
      r.userId,
      r.role,
      r.provider,
      r.type,
      r.model ?? "",
      String(r.requestChars),
      String(r.responseChars),
      String(r.tokens),
      String(r.durationSeconds),
      r.isStream ? "true" : "false",
      r.success ? "true" : "false",
      r.errorMessage ?? "",
      r.createdAt.toISOString(),
    ]);
    return { header, data };
  }

  async getAiUsageSummaryV2(filters?: {
    userId?: string;
    provider?: string;
    from?: string;
    to?: string;
  }) {
    const start = filters?.from ? new Date(filters.from) : this.startOfUtcDay();
    const end = filters?.to ? new Date(filters.to) : undefined;
    const whereUser = filters?.userId ? { userId: filters.userId } : undefined;
    const whereProvider = filters?.provider ? { provider: filters.provider as any } : undefined;

    const [requestErrorsCount, requestTotals] = await this.prisma.$transaction([
      this.prisma.aiRequestLog.count({
        where: {
          success: false,
          createdAt: { gte: start, lte: end },
          ...(whereUser ?? {}),
          ...(whereProvider ?? {}),
        },
      }),
      this.prisma.aiRequestLog.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          ...(whereUser ?? {}),
          ...(whereProvider ?? {}),
        },
        _sum: {
          tokens: true,
          requestChars: true,
          responseChars: true,
          durationSeconds: true,
        },
        _count: { id: true },
      }),
    ]);

    return {
      from: start.toISOString(),
      to: end?.toISOString(),
      totals: {
        requests: requestTotals._count.id ?? 0,
        tokens: requestTotals._sum.tokens ?? 0,
        requestChars: requestTotals._sum.requestChars ?? 0,
        responseChars: requestTotals._sum.responseChars ?? 0,
        durationSeconds: requestTotals._sum.durationSeconds ?? 0,
      },
      errors: {
        requestErrors: requestErrorsCount,
      },
    };
  }

  private dayKey() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private startOfUtcDay() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  }
}
