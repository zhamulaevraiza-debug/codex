import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({ example: "Иван" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customerName!: string;

  @ApiProperty({ example: "+7 700 000 0000" })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  customerPhone!: string;

  @ApiPropertyOptional({ example: "Алматы" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiProperty({ example: "ул. Абая, 1" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  address!: string;

  @ApiPropertyOptional({ example: "12" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment?: string;

  @ApiPropertyOptional({ example: "2" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  entrance?: string;

  @ApiPropertyOptional({ example: "5" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  floor?: string;

  @ApiPropertyOptional({ example: "Позвонить за 15 минут" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  operatorNote?: string;

  @ApiPropertyOptional({ example: "2026-05-15T10:00:00Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  pickupAt?: Date;
}
