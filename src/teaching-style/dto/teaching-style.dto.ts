import { IsBoolean, IsOptional, IsString } from "class-validator";

export class TeachingStyleCreateDto {
  @IsString()
  name!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class TeachingStyleUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
