import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSections() {
    return this.prisma.section.findMany({
      orderBy: { order: "asc" },
    });
  }

  async getLessons(sectionId: string) {
    return this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: "asc" },
    });
  }

  async getCards(lessonId: string) {
    return this.prisma.card.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
    });
  }

  async getQuizzes(lessonId: string) {
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: { options: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
