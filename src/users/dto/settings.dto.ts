import { IsEnum, IsInt, IsOptional } from "class-validator";
import { ColorScheme, FontFamily, ThemeMode } from "@prisma/client";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  fontSize?: number;

  @ApiPropertyOptional({ enum: FontFamily })
  @IsOptional()
  @IsEnum(FontFamily)
  fontFamily?: FontFamily;

  @ApiPropertyOptional({ enum: ThemeMode })
  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;

  @ApiPropertyOptional({ enum: ColorScheme })
  @IsOptional()
  @IsEnum(ColorScheme)
  colorScheme?: ColorScheme;
}
