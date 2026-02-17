import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { UpdateProfileDto } from "./dto/profile.dto";
import { UpdateSettingsDto } from "./dto/settings.dto";
import { AiLimitsService } from "../ai/ai-limits.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limits: AiLimitsService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: true,
        settings: true,
      },
    });
    if (!user) {
      return null;
    }
    const limitSnapshot = await this.limits.getRemainingLimits(userId);
    return {
      ...user,
      limits: limitSnapshot,
      audit: {
        dayKey: limitSnapshot.usage.dayKey,
        errorsToday: {
          requestErrors: limitSnapshot.usageErrors?.requestErrors ?? 0,
          limitEvents: limitSnapshot.usageErrors?.limitEvents ?? 0,
        },
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }
}
