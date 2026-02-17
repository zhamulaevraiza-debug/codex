import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { TeachingStyleCreateDto, TeachingStyleUpdateDto } from "./dto/teaching-style.dto";

@Injectable()
export class TeachingStyleService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefault() {
    const style = await this.prisma.teachingStyle.findFirst({
      where: { isDefault: true },
    });
    if (!style) {
      throw new NotFoundException("Default teaching style not set");
    }
    return style;
  }

  getById(id: string) {
    return this.prisma.teachingStyle.findUnique({ where: { id } });
  }

  listAll() {
    return this.prisma.teachingStyle.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(dto: TeachingStyleCreateDto) {
    if (dto.isDefault) {
      await this.prisma.teachingStyle.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.teachingStyle.create({ data: dto });
  }

  async update(id: string, dto: TeachingStyleUpdateDto) {
    if (dto.isDefault) {
      await this.prisma.teachingStyle.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.teachingStyle.update({ where: { id }, data: dto });
  }

  delete(id: string) {
    return this.prisma.teachingStyle.delete({ where: { id } });
  }
}
