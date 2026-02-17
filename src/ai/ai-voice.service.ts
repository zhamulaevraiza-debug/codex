import { BadRequestException, Injectable } from "@nestjs/common";
import OpenAI, { toFile } from "openai";
import { createClient } from "@deepgram/sdk";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { AiProvider, AiRole } from "@prisma/client";
import { AiKeysService } from "./ai-keys.service";
import { AiConfigService } from "./ai-config.service";
import { TtsDto } from "./dto/tts.dto";
import { SttDto } from "./dto/stt.dto";
import { AiLimitsService } from "./ai-limits.service";
import { AiAuditService } from "./ai-audit.service";

@Injectable()
export class AiVoiceService {
  constructor(
    private readonly keys: AiKeysService,
    private readonly config: AiConfigService,
    private readonly limits: AiLimitsService,
    private readonly audit: AiAuditService,
  ) {}

  async tts(userId: string, dto: TtsDto): Promise<{ buffer: Buffer; contentType: string }> {
    const config = await this.config.getForRole(userId, AiRole.TTS);
    if (!config) {
      throw new BadRequestException("TTS config not set");
    }
    await this.limits.assertTtsLimit(userId, dto.text.length);
    if (config.provider !== AiProvider.ELEVENLABS) {
      throw new BadRequestException("Only ELEVENLABS TTS supported");
    }
    const apiKey = await this.keys.getDecrypted(userId, config.provider);
    if (!apiKey) {
      throw new BadRequestException("API key not set for provider");
    }

    try {
      const client = new ElevenLabsClient({ apiKey });
      const audio = await client.textToSpeech.convert(dto.voiceId, {
        text: dto.text,
        model_id: dto.modelId ?? "eleven_multilingual_v2",
      });
      const arrayBuffer = await audio.arrayBuffer();
      const contentType = "audio/mpeg";
      await this.limits.recordTts(userId, dto.text.length);
      await this.audit.logTts({
        userId,
        provider: config.provider,
        model: dto.modelId ?? "eleven_multilingual_v2",
        requestChars: dto.text.length,
        success: true,
      });
      return { buffer: Buffer.from(arrayBuffer), contentType };
    } catch (error: any) {
      await this.audit.logTts({
        userId,
        provider: config.provider,
        model: dto.modelId ?? "eleven_multilingual_v2",
        requestChars: dto.text.length,
        success: false,
        errorMessage: error?.message ?? "Unknown error",
      });
      throw error;
    }
  }

  async stt(userId: string, audio: Buffer, dto: SttDto): Promise<string> {
    const config = await this.config.getForRole(userId, AiRole.STT);
    if (!config) {
      throw new BadRequestException("STT config not set");
    }
    const seconds = dto.durationSeconds ?? this.estimateSeconds(audio);
    await this.limits.assertSttLimit(userId, seconds);
    const apiKey = await this.keys.getDecrypted(userId, config.provider);
    if (!apiKey) {
      throw new BadRequestException("API key not set for provider");
    }

    try {
      if (config.provider === AiProvider.DEEPGRAM) {
        const deepgram = createClient(apiKey);
        const response = await deepgram.listen.prerecorded.transcribeFile(audio, {
          model: dto.model ?? "nova-3",
          language: dto.language ?? "ru",
          smart_format: true,
        });
        const transcript =
          response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
        await this.limits.recordStt(userId, seconds);
        await this.audit.logStt({
          userId,
          provider: config.provider,
          model: dto.model ?? "nova-3",
          durationSeconds: seconds,
          success: true,
        });
        return transcript;
      }

      if (config.provider === AiProvider.OPENAI) {
        const client = new OpenAI({ apiKey });
        const file = await toFile(audio, "audio.wav");
        const response = await client.audio.transcriptions.create({
          file,
          model: dto.model ?? "whisper-1",
          language: dto.language,
        });
        const text = response.text ?? "";
        await this.limits.recordStt(userId, seconds);
        await this.audit.logStt({
          userId,
          provider: config.provider,
          model: dto.model ?? "whisper-1",
          durationSeconds: seconds,
          success: true,
        });
        return text;
      }

      throw new BadRequestException("Unsupported STT provider");
    } catch (error: any) {
      await this.audit.logStt({
        userId,
        provider: config.provider,
        model: dto.model ?? "unknown",
        durationSeconds: seconds,
        success: false,
        errorMessage: error?.message ?? "Unknown error",
      });
      throw error;
    }
  }

  private estimateSeconds(audio: Buffer) {
    const bytesPerSecond = 32000; // 16kHz * 16-bit * mono
    return Math.max(1, Math.ceil(audio.length / bytesPerSecond));
  }
}
