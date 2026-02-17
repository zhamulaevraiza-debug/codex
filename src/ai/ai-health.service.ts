import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AiProvider, AiRole } from "@prisma/client";
import { AiKeysService } from "./ai-keys.service";

@Injectable()
export class AiHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly keys: AiKeysService,
  ) {}

  async getStatus(userId: string) {
    const configs = await this.prisma.aiProviderConfig.findMany({
      where: { userId },
      orderBy: { role: "asc" },
    });

    const providers = Array.from(new Set(configs.map((c) => c.provider)));
    const providerStatus: Record<string, any> = {};
    for (const provider of providers) {
      const key = await this.keys.getDecrypted(userId, provider);
      providerStatus[provider] = {
        keySet: !!key,
        roles: configs.filter((c) => c.provider === provider).map((c) => c.role),
      };
    }

    const missingRoles = Object.values(AiRole).filter(
      (role) => !configs.find((c) => c.role === role),
    );

    return {
      configuredRoles: configs.map((c) => c.role),
      missingRoles,
      providers: providerStatus,
    };
  }
}
