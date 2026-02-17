import { Injectable, BadRequestException } from "@nestjs/common";
import { AiProvider } from "@prisma/client";
import { AiStrategy } from "./strategies/ai-strategy";
import { OpenAiStrategy } from "./strategies/openai.strategy";
import { AnthropicStrategy } from "./strategies/anthropic.strategy";
import { DeepSeekStrategy } from "./strategies/deepseek.strategy";

@Injectable()
export class AiAdapterService {
  private readonly strategies: Record<AiProvider, AiStrategy>;

  constructor() {
    this.strategies = {
      OPENAI: new OpenAiStrategy(),
      ANTHROPIC: new AnthropicStrategy(),
      DEEPSEEK: new DeepSeekStrategy(),
      DEEPGRAM: new OpenAiStrategy(),
      ELEVENLABS: new OpenAiStrategy(),
      CLOUDCODE: new OpenAiStrategy(),
      OPENAI_COMPAT: new OpenAiStrategy(),
    };
  }

  getStrategy(provider: AiProvider): AiStrategy {
    const strategy = this.strategies[provider];
    if (!strategy) {
      throw new BadRequestException("Unsupported provider");
    }
    return strategy;
  }
}
