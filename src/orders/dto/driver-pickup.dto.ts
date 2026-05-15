import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class DriverPickupDto {
  @ApiPropertyOptional({ example: 3, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  carpetsCount?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  textilesCount?: number;

  @ApiPropertyOptional({ example: "Сильные пятна на одном ковре" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  driverNote?: string;

  @ApiPropertyOptional({ example: ["https://example.com/photo1.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  driverPhotos?: string[];
}
