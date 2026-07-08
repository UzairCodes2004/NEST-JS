import { IsString, IsNotEmpty, IsInt, IsDefined } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsInt()
  @IsDefined()
  @IsNotEmpty()
  issueID!: number;
}