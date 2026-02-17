import { IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CardCreateDto {
  @ApiProperty()
  @IsString()
  lessonId!: string;

  @ApiProperty()
  @IsInt()
  order!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arabicText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationOther?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortExplanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullExplanation?: string;
}

export class CardUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  arabicText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationRu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  translationOther?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortExplanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullExplanation?: string;
}
