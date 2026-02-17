import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { UpsertApiKeyDto } from "./dto/api-key.dto";
import { UpsertAiConfigDto } from "./dto/ai-config.dto";
import { ChatDto } from "./dto/chat.dto";
import { TtsDto } from "./dto/tts.dto";
import { SttDto } from "./dto/stt.dto";
import { AiKeysService } from "./ai-keys.service";
import { AiConfigService } from "./ai-config.service";
import { AiService } from "./ai.service";
import { from, map } from "rxjs";
import { AiProvider, AiRole } from "@prisma/client";
import { AiVoiceService } from "./ai-voice.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AiHealthService } from "./ai-health.service";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly keys: AiKeysService,
    private readonly configs: AiConfigService,
    private readonly ai: AiService,
    private readonly voice: AiVoiceService,
    private readonly health: AiHealthService,
  ) {}

  @Post("keys")
  @ApiResponse({ status: 201, description: "API key saved" })
  upsertKey(@Req() req: { user: { userId: string } }, @Body() dto: UpsertApiKeyDto) {
    return this.keys.upsert(req.user.userId, dto);
  }

  @Get("keys")
  @ApiResponse({ status: 200, description: "List API keys (masked)" })
  listKeys(@Req() req: { user: { userId: string } }) {
    return this.keys.list(req.user.userId);
  }

  @Delete("keys/:provider")
  @ApiResponse({ status: 200, description: "API key deleted" })
  deleteKey(
    @Req() req: { user: { userId: string } },
    @Param("provider", new ParseEnumPipe(AiProvider)) provider: AiProvider,
  ) {
    return this.keys.delete(req.user.userId, provider);
  }

  @Post("config")
  @ApiResponse({ status: 201, description: "AI config saved" })
  upsertConfig(@Req() req: { user: { userId: string } }, @Body() dto: UpsertAiConfigDto) {
    return this.configs.upsert(req.user.userId, dto);
  }

  @Get("config")
  @ApiResponse({ status: 200, description: "List AI config" })
  listConfig(@Req() req: { user: { userId: string } }) {
    return this.configs.list(req.user.userId);
  }

  @Get("health")
  @ApiResponse({ status: 200, description: "Provider health summary" })
  healthStatus(@Req() req: { user: { userId: string } }) {
    return this.health.getStatus(req.user.userId);
  }

  @Post("chat")
  @ApiResponse({ status: 200, description: "Chat completion" })
  async chat(@Req() req: { user: { userId: string } }, @Body() dto: ChatDto) {
    const output = await this.ai.complete(req.user.userId, dto.message, dto.role);
    return { output };
  }

  @Post("tts")
  @ApiResponse({ status: 200, description: "Text to speech audio" })
  async tts(
    @Req() req: { user: { userId: string } },
    @Body() dto: TtsDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const audio = await this.voice.tts(req.user.userId, dto);
    res.setHeader("Content-Type", audio.contentType);
    return audio.buffer;
  }

  @Post("stt")
  @ApiResponse({ status: 200, description: "Speech to text" })
  @UseInterceptors(FileInterceptor("file"))
  async stt(
    @Req() req: { user: { userId: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SttDto,
  ) {
    if (!file?.buffer) {
      return { text: "" };
    }
    const text = await this.voice.stt(req.user.userId, file.buffer, dto);
    return { text };
  }

  @Sse("stream")
  @ApiResponse({ status: 200, description: "Streaming completion (SSE)" })
  stream(
    @Req() req: { user: { userId: string } },
    @Query("message") message: string,
    @Query("role") role?: AiRole,
  ) {
    const iterator = this.ai.stream(req.user.userId, message, role);
    return from(iterator).pipe(map((chunk) => ({ data: chunk })));
  }
}
