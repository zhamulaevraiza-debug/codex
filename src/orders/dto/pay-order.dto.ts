import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class PayOrderDto {
  @ApiPropertyOptional({
    description: "Сумма оплаты. По умолчанию — полная сумма заказа.",
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: "Наличные" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
