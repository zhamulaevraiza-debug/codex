import { Injectable } from "@nestjs/common";
import { AiProvider, AiRequestType, AiRole } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class AiAuditService {
  constructor(private readonly prisma: PrismaService) {}

  logLlm(params: {
    userId: string;
    role: AiRole;
    provider: AiProvider;
    model?: string | null;
    requestChars: number;
    responseChars: number;
    tokens: number;
    isStream: boolean;
    success: boolean;
    errorMessage?: string;
  }) {
    return this.prisma.aiRequestLog.create({
      data: {
        userId: params.userId,
        role: params.role,
        provider: params.provider,
        type: AiRequestType.LLM,
        model: params.model ?? undefined,
        requestChars: params.requestChars,
        responseChars: params.responseChars,
        tokens: params.tokens,
        isStream: params.isStream,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    });
  }

  logTts(params: {
    userId: string;
    provider: AiProvider;
    model?: string | null;
    requestChars: number;
    success: boolean;
    errorMessage?: string;
  }) {
    return this.prisma.aiRequestLog.create({
      data: {
        userId: params.userId,
        role: AiRole.TTS,
        provider: params.provider,
        type: AiRequestType.TTS,
        model: params.model ?? undefined,
        requestChars: params.requestChars,
        isStream: false,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    });
  }

  logStt(params: {
    userId: string;
    provider: AiProvider;
    model?: string | null;
    durationSeconds: number;
    success: boolean;
    errorMessage?: string;
  }) {
    return this.prisma.aiRequestLog.create({
      data: {
        userId: params.userId,
        role: AiRole.STT,
        provider: params.provider,
        type: AiRequestType.STT,
        model: params.model ?? undefined,
        durationSeconds: params.durationSeconds,
        isStream: false,
        success: params.success,
        errorMessage: params.errorMessage,
      },
    });
  }
}
