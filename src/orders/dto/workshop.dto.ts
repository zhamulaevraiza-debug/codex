import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class WorkshopUpdateDto {
  @ApiPropertyOptional({ example: 1500, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerSqm?: number;

  @ApiPropertyOptional({ example: "Закончили обработку" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  workshopNote?: string;
}
