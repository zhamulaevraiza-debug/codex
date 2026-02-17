import { IsEnum, IsOptional, IsString } from "class-validator";
import { AiProvider, AiRole } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpsertAiConfigDto {
  @ApiProperty({ enum: AiRole })
  @IsEnum(AiRole)
  role!: AiRole;

  @ApiProperty({ enum: AiProvider })
  @IsEnum(AiProvider)
  provider!: AiProvider;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}
