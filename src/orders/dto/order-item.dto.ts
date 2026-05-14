import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateOrderItemDto {
  @ApiPropertyOptional({ example: "Ковер 1" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiProperty({ example: 2.5, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.01)
  length!: number;

  @ApiProperty({ example: 1.6, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.01)
  width!: number;

  @ApiProperty({ example: 1500, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerSqm!: number;

  @ApiPropertyOptional({ example: "Пятна, моль" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  defects?: string;

  @ApiPropertyOptional({ example: "Дополнительная чистка" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ example: ["https://example.com/photo1.jpg"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateOrderItemDto extends CreateOrderItemDto {}
