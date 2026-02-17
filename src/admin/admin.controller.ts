import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { SectionCreateDto, SectionUpdateDto } from "./dto/section.dto";
import { LessonCreateDto, LessonUpdateDto } from "./dto/lesson.dto";
import { CardCreateDto, CardUpdateDto } from "./dto/card.dto";
import { QuizCreateDto, QuizUpdateDto } from "./dto/quiz.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { Role } from "@prisma/client";
import {
  TeachingStyleCreateDto,
  TeachingStyleUpdateDto,
} from "../teaching-style/dto/teaching-style.dto";
import { AiLimitCreateDto, AiLimitPresetApplyDto, AiLimitUpdateDto } from "./dto/ai-limits.dto";
import { Response } from "express";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post("sections")
  @ApiResponse({ status: 201, description: "Section created" })
  createSection(@Body() dto: SectionCreateDto) {
    return this.admin.createSection(dto);
  }

  @Patch("sections/:id")
  @ApiResponse({ status: 200, description: "Section updated" })
  updateSection(@Param("id") id: string, @Body() dto: SectionUpdateDto) {
    return this.admin.updateSection(id, dto);
  }

  @Delete("sections/:id")
  @ApiResponse({ status: 200, description: "Section deleted" })
  deleteSection(@Param("id") id: string) {
    return this.admin.deleteSection(id);
  }

  @Post("lessons")
  @ApiResponse({ status: 201, description: "Lesson created" })
  createLesson(@Body() dto: LessonCreateDto) {
    return this.admin.createLesson(dto);
  }

  @Patch("lessons/:id")
  @ApiResponse({ status: 200, description: "Lesson updated" })
  updateLesson(@Param("id") id: string, @Body() dto: LessonUpdateDto) {
    return this.admin.updateLesson(id, dto);
  }

  @Delete("lessons/:id")
  @ApiResponse({ status: 200, description: "Lesson deleted" })
  deleteLesson(@Param("id") id: string) {
    return this.admin.deleteLesson(id);
  }

  @Post("cards")
  @ApiResponse({ status: 201, description: "Card created" })
  createCard(@Body() dto: CardCreateDto) {
    return this.admin.createCard(dto);
  }

  @Patch("cards/:id")
  @ApiResponse({ status: 200, description: "Card updated" })
  updateCard(@Param("id") id: string, @Body() dto: CardUpdateDto) {
    return this.admin.updateCard(id, dto);
  }

  @Delete("cards/:id")
  @ApiResponse({ status: 200, description: "Card deleted" })
  deleteCard(@Param("id") id: string) {
    return this.admin.deleteCard(id);
  }

  @Post("quizzes")
  @ApiResponse({ status: 201, description: "Quiz created" })
  createQuiz(@Body() dto: QuizCreateDto) {
    return this.admin.createQuiz(dto);
  }

  @Patch("quizzes/:id")
  @ApiResponse({ status: 200, description: "Quiz updated" })
  updateQuiz(@Param("id") id: string, @Body() dto: QuizUpdateDto) {
    return this.admin.updateQuiz(id, dto);
  }

  @Delete("quizzes/:id")
  @ApiResponse({ status: 200, description: "Quiz deleted" })
  deleteQuiz(@Param("id") id: string) {
    return this.admin.deleteQuiz(id);
  }

  @Post("teaching-style")
  @ApiResponse({ status: 201, description: "Teaching style created" })
  createTeachingStyle(@Body() dto: TeachingStyleCreateDto) {
    return this.admin.createTeachingStyle(dto);
  }

  @Patch("teaching-style/:id")
  @ApiResponse({ status: 200, description: "Teaching style updated" })
  updateTeachingStyle(@Param("id") id: string, @Body() dto: TeachingStyleUpdateDto) {
    return this.admin.updateTeachingStyle(id, dto);
  }

  @Delete("teaching-style/:id")
  @ApiResponse({ status: 200, description: "Teaching style deleted" })
  deleteTeachingStyle(@Param("id") id: string) {
    return this.admin.deleteTeachingStyle(id);
  }

  @Get("ai-limits")
  @ApiResponse({ status: 200, description: "List AI limits" })
  listAiLimits() {
    return this.admin.listAiLimits();
  }

  @Post("ai-limits")
  @ApiResponse({ status: 201, description: "AI limit created" })
  createAiLimit(@Body() dto: AiLimitCreateDto) {
    return this.admin.createAiLimit(dto);
  }

  @Patch("ai-limits/:id")
  @ApiResponse({ status: 200, description: "AI limit updated" })
  updateAiLimit(@Param("id") id: string, @Body() dto: AiLimitUpdateDto) {
    return this.admin.updateAiLimit(id, dto);
  }

  @Delete("ai-limits/:id")
  @ApiResponse({ status: 200, description: "AI limit deleted" })
  deleteAiLimit(@Param("id") id: string) {
    return this.admin.deleteAiLimit(id);
  }

  @Get("ai-limit-events")
  @ApiResponse({ status: 200, description: "List AI limit events" })
  listAiLimitEvents(
    @Query("userId") userId?: string,
    @Query("role") role?: string,
    @Query("type") type?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.admin.listAiLimitEvents({
      userId,
      role,
      type,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get("ai-limit-events/export")
  @ApiResponse({ status: 200, description: "Export AI limit events CSV" })
  async exportAiLimitEvents(
    @Query("userId") userId: string | undefined,
    @Query("role") role: string | undefined,
    @Query("type") type: string | undefined,
    @Query("limit") limit: string | undefined,
    @Query("offset") offset: string | undefined,
    @Res() res: Response,
  ) {
    const events = await this.admin.listAiLimitEvents({
      userId,
      role,
      type,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    const header = ["id", "userId", "role", "type", "isSoft", "message", "metadata", "createdAt"];
    const rows = events.map((e) => [
      e.id,
      e.userId,
      e.role,
      e.type,
      e.isSoft ? "true" : "false",
      e.message,
      e.metadata ?? "",
      e.createdAt.toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map(this.csvEscape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"ai-limit-events.csv\"");
    return res.send(csv);
  }

  @Get("ai-limits/config")
  @ApiResponse({ status: 200, description: "AI limits config and presets" })
  getAiLimitConfig() {
    return this.admin.getAiLimitConfig();
  }

  @Post("ai-limits/apply-preset")
  @ApiResponse({ status: 200, description: "Preset applied" })
  applyPreset(@Body() dto: AiLimitPresetApplyDto) {
    return this.admin.applyPreset(dto);
  }

  @Get("ai-usage/summary")
  @ApiResponse({ status: 200, description: "AI usage summary (daily)" })
  getAiUsageSummary(@Query("userId") userId?: string) {
    return this.admin.getAiUsageSummary({ userId });
  }

  @Get("ai-usage/summary-v2")
  @ApiResponse({ status: 200, description: "AI usage summary (filtered)" })
  getAiUsageSummaryV2(
    @Query("userId") userId?: string,
    @Query("provider") provider?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.admin.getAiUsageSummaryV2({ userId, provider, from, to });
  }

  @Get("ai-request-logs")
  @ApiResponse({ status: 200, description: "List AI request logs" })
  listAiRequestLogs(
    @Query("userId") userId?: string,
    @Query("provider") provider?: string,
    @Query("role") role?: string,
    @Query("type") type?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.admin.listAiRequestLogs({
      userId,
      provider,
      role,
      type,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get("ai-request-logs/export")
  @ApiResponse({ status: 200, description: "Export AI request logs CSV" })
  async exportAiRequestLogs(
    @Query("userId") userId?: string,
    @Query("provider") provider?: string,
    @Query("role") role?: string,
    @Query("type") type?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Res() res: Response,
  ) {
    const { header, data } = await this.admin.exportAiRequestLogsCsv({
      userId,
      provider,
      role,
      type,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    const csv = [header, ...data].map((r) => r.map(this.csvEscape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"ai-request-logs.csv\"");
    return res.send(csv);
  }

  private csvEscape(value: string) {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, "\"\"")}"`;
    }
    return value;
  }
}
