import { IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TtsDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsString()
  voiceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelId?: string;
}
