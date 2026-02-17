import { IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SectionCreateDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsInt()
  order!: number;
}

export class SectionUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}
