import { IsEnum, IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewManagerRequestDto {
  @IsEnum(ReviewAction)
  @IsNotEmpty()
  action!: ReviewAction;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}