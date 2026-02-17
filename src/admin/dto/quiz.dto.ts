import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { QuizType } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class QuizOptionDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class QuizCreateDto {
  @ApiProperty()
  @IsString()
  lessonId!: string;

  @ApiProperty({ enum: QuizType })
  @IsEnum(QuizType)
  type!: QuizType;

  @ApiProperty()
  @IsString()
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ type: [QuizOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options!: QuizOptionDto[];
}

export class QuizUpdateDto {
  @ApiPropertyOptional({ enum: QuizType })
  @IsOptional()
  @IsEnum(QuizType)
  type?: QuizType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ type: [QuizOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionDto)
  options?: QuizOptionDto[];
}
