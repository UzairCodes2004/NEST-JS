import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class ValidateResetTokenDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  token!: string;
}
