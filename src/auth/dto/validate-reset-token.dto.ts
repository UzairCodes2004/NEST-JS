import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateResetTokenDto {
  @IsString()
  @IsNotEmpty()
  data!: string;
}