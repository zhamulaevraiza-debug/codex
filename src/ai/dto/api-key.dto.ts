import { IsEnum, IsString } from "class-validator";
import { AiProvider } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class UpsertApiKeyDto {
  @ApiProperty({ enum: AiProvider })
  @IsEnum(AiProvider)
  provider!: AiProvider;

  @ApiProperty()
  @IsString()
  apiKey!: string;
}
