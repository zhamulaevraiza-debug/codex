import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class CreateStaffDto {
  @ApiProperty({ example: "operator@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.OPERATOR })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ example: "Имя Фамилия" })
  @IsOptional()
  @IsString()
  name?: string;
}
