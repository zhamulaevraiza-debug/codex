import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/prisma.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async list(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        profile: { create: { name: dto.name } },
        settings: { create: {} },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { name: true } },
      },
    });
    return user;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const data: Record<string, unknown> = {};
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { name: true } },
      },
    });

    if (dto.name !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { userId: id },
        update: { name: dto.name },
        create: { userId: id, name: dto.name },
      });
    }

    return updated;
  }
}
