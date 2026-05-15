import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CancelOrderDto {
  @ApiPropertyOptional({ example: "Клиент передумал" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
