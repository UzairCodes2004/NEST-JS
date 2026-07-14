import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateManagerRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  experience?: string;
}