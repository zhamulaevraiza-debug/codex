import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { AiRole, LimitType } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AiLimitCreateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: AiRole })
  @IsOptional()
  @IsEnum(AiRole)
  role?: AiRole;

  @ApiProperty({ enum: LimitType })
  @IsEnum(LimitType)
  type!: LimitType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSoft?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AiLimitUpdateDto {
  @ApiPropertyOptional({ enum: AiRole })
  @IsOptional()
  @IsEnum(AiRole)
  role?: AiRole;

  @ApiPropertyOptional({ enum: LimitType })
  @IsOptional()
  @IsEnum(LimitType)
  type?: LimitType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSoft?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AiLimitPresetApplyDto {
  @ApiProperty()
  @IsString()
  preset!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: AiRole })
  @IsOptional()
  @IsEnum(AiRole)
  role?: AiRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSoft?: boolean;
}
