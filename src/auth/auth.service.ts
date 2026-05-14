import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../common/prisma.service";
import { Role } from "@prisma/client";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto): Promise<{ userId: string; tokens: Tokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: {
            name: dto.name,
            age: dto.age,
            profession: dto.profession,
            level: dto.level,
          },
        },
        settings: {
          create: {},
        },
      },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { userId: user.id, tokens };
  }

  async login(dto: LoginDto): Promise<{ userId: string; tokens: Tokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { userId: user.id, tokens };
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const userId = payload.sub as string;

    const tokenRow = await this.prisma.refreshToken.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!tokenRow) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const ok = await bcrypt.compare(refreshToken, tokenRow.tokenHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    const tokens = await this.issueTokens(userId, user.email, user.role);
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: tokenRow.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
          expiresAt: this.refreshExpiryDate(),
        },
      }),
    ]);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const userId = payload.sub as string;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });

    for (const token of tokens) {
      const ok = await bcrypt.compare(refreshToken, token.tokenHash);
      if (ok) {
        await this.prisma.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }
  }

  private async issueTokens(userId: string, email: string, role: Role): Promise<Tokens> {
    const accessExpires = (process.env.JWT_ACCESS_EXPIRES ?? "15m") as unknown as number;
    const refreshExpires = (process.env.JWT_REFRESH_EXPIRES ?? "7d") as unknown as number;
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpires,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpires,
      },
    );
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: this.refreshExpiryDate(),
      },
    });
  }

  private refreshExpiryDate(): Date {
    const days = 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async verifyRefreshToken(token: string): Promise<{ sub: string; email: string }> {
    try {
      return await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
