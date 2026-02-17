import { IsEnum, IsOptional, IsString } from "class-validator";
import { AiRole } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ChatDto {
  @ApiPropertyOptional({ enum: AiRole })
  @IsOptional()
  @IsEnum(AiRole)
  role?: AiRole;

  @ApiProperty()
  @IsString()
  message!: string;
}
