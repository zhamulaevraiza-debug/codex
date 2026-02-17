import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { UpsertApiKeyDto } from "./dto/api-key.dto";
import { AiProvider } from "@prisma/client";

@Injectable()
export class AiKeysService {
  constructor(private readonly prisma: PrismaService, private readonly crypto: CryptoService) {}

  async upsert(userId: string, dto: UpsertApiKeyDto) {
    const encryptedKey = this.crypto.encrypt(dto.apiKey);
    return this.prisma.apiKey.upsert({
      where: {
        userId_provider: { userId, provider: dto.provider },
      },
      update: { encryptedKey },
      create: {
        userId,
        provider: dto.provider,
        encryptedKey,
      },
    });
  }

  async list(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      masked: this.mask(this.crypto.decrypt(k.encryptedKey)),
    }));
  }

  async delete(userId: string, provider: AiProvider) {
    return this.prisma.apiKey.delete({
      where: { userId_provider: { userId, provider } },
    });
  }

  async getDecrypted(userId: string, provider: AiProvider): Promise<string | null> {
    const row = await this.prisma.apiKey.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (!row) {
      return null;
    }
    return this.crypto.decrypt(row.encryptedKey);
  }

  private mask(key: string) {
    if (key.length <= 6) return "***";
    return `${key.slice(0, 2)}***${key.slice(-2)}`;
  }
}
