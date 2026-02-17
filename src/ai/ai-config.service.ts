import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { UpsertAiConfigDto } from "./dto/ai-config.dto";
import { AiRole } from "@prisma/client";

@Injectable()
export class AiConfigService {
  constructor(private readonly prisma: PrismaService) {}

  upsert(userId: string, dto: UpsertAiConfigDto) {
    return this.prisma.aiProviderConfig.upsert({
      where: { userId_role: { userId, role: dto.role } },
      update: { provider: dto.provider, model: dto.model },
      create: { userId, role: dto.role, provider: dto.provider, model: dto.model },
    });
  }

  list(userId: string) {
    return this.prisma.aiProviderConfig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  getForRole(userId: string, role: AiRole) {
    return this.prisma.aiProviderConfig.findUnique({
      where: { userId_role: { userId, role } },
    });
  }
}
