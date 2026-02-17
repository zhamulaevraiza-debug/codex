import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EducationService } from "./education.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

@ApiTags("education")
@ApiBearerAuth()
@Controller("education")
@UseGuards(JwtAuthGuard)
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Get("sections")
  @ApiResponse({ status: 200, description: "List sections" })
  async getSections() {
    return this.education.getSections();
  }

  @Get("sections/:sectionId/lessons")
  @ApiResponse({ status: 200, description: "List lessons by section" })
  async getLessons(@Param("sectionId") sectionId: string) {
    return this.education.getLessons(sectionId);
  }

  @Get("lessons/:lessonId/cards")
  @ApiResponse({ status: 200, description: "List cards by lesson" })
  async getCards(@Param("lessonId") lessonId: string) {
    return this.education.getCards(lessonId);
  }

  @Get("lessons/:lessonId/quizzes")
  @ApiResponse({ status: 200, description: "List quizzes by lesson" })
  async getQuizzes(@Param("lessonId") lessonId: string) {
    return this.education.getQuizzes(lessonId);
  }
}
