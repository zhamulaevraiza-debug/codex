import { IsEmail, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "strongpassword" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: "Имя" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional({ example: "Учитель" })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: "Начальный" })
  @IsOptional()
  @IsString()
  level?: string;
}
