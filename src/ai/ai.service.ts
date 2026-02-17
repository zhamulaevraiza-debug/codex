import { Injectable, BadRequestException } from "@nestjs/common";
import { AiRole } from "@prisma/client";
import { AiKeysService } from "./ai-keys.service";
import { AiConfigService } from "./ai-config.service";
import { AiAdapterService } from "./ai-adapter.service";
import { AiLimitsService } from "./ai-limits.service";
import { AiAuditService } from "./ai-audit.service";

@Injectable()
export class AiService {
  constructor(
    private readonly keys: AiKeysService,
    private readonly config: AiConfigService,
    private readonly adapter: AiAdapterService,
    private readonly limits: AiLimitsService,
    private readonly audit: AiAuditService,
  ) {}

  async complete(userId: string, message: string, role?: AiRole) {
    const resolvedRole = role ?? AiRole.PRIMARY_LLM;
    if (resolvedRole === AiRole.TTS || resolvedRole === AiRole.STT) {
      throw new BadRequestException("Invalid role for chat");
    }
    const inputTokens = this.estimateTokens(message);
    await this.limits.assertLlmLimits(userId, resolvedRole, inputTokens);
    const config = await this.config.getForRole(userId, resolvedRole);
    if (!config) {
      throw new BadRequestException("AI config not set for role");
    }
    const apiKey = await this.keys.getDecrypted(userId, config.provider);
    if (!apiKey) {
      throw new BadRequestException("API key not set for provider");
    }
    const strategy = this.adapter.getStrategy(config.provider);
    try {
      const output = await strategy.complete({ message, model: config.model ?? undefined, apiKey });
      const totalTokens = inputTokens + this.estimateTokens(output);
      await this.limits.recordLlmUsage(userId, resolvedRole, totalTokens);
      await this.audit.logLlm({
        userId,
        role: resolvedRole,
        provider: config.provider,
        model: config.model ?? null,
        requestChars: message.length,
        responseChars: output.length,
        tokens: totalTokens,
        isStream: false,
        success: true,
      });
      return output;
    } catch (error: any) {
      await this.audit.logLlm({
        userId,
        role: resolvedRole,
        provider: config.provider,
        model: config.model ?? null,
        requestChars: message.length,
        responseChars: 0,
        tokens: inputTokens,
        isStream: false,
        success: false,
        errorMessage: error?.message ?? "Unknown error",
      });
      throw error;
    }
  }

  async *stream(userId: string, message: string, role?: AiRole) {
    const resolvedRole = role ?? AiRole.PRIMARY_LLM;
    if (resolvedRole === AiRole.TTS || resolvedRole === AiRole.STT) {
      throw new BadRequestException("Invalid role for stream");
    }
    const inputTokens = this.estimateTokens(message);
    await this.limits.assertLlmLimits(userId, resolvedRole, inputTokens);
    const config = await this.config.getForRole(userId, resolvedRole);
    if (!config) {
      throw new BadRequestException("AI config not set for role");
    }
    const apiKey = await this.keys.getDecrypted(userId, config.provider);
    if (!apiKey) {
      throw new BadRequestException("API key not set for provider");
    }
    const strategy = this.adapter.getStrategy(config.provider);
    let outputChars = 0;
    let streamError: any = null;
    try {
      for await (const chunk of strategy.streamCompletion({
        message,
        model: config.model ?? undefined,
        apiKey,
      })) {
        outputChars += chunk.length;
        yield chunk;
      }
    } catch (error: any) {
      streamError = error;
      throw error;
    } finally {
      const totalTokens = inputTokens + this.estimateTokensByChars(outputChars);
      await this.limits.recordLlmUsage(userId, resolvedRole, totalTokens);
      await this.audit.logLlm({
        userId,
        role: resolvedRole,
        provider: config.provider,
        model: config.model ?? null,
        requestChars: message.length,
        responseChars: outputChars,
        tokens: totalTokens,
        isStream: true,
        success: !streamError,
        errorMessage: streamError?.message,
      });
    }
  }

  private estimateTokens(text: string) {
    return this.estimateTokensByChars(text.length);
  }

  private estimateTokensByChars(chars: number) {
    return Math.max(1, Math.ceil(chars / 4));
  }
}
