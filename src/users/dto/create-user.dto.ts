import { IsString, IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreatedUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  // ─── NEW: Role requested by the user 
  @IsOptional()
  @IsEnum(Role)
  requestedRole?: Role;

  // ─── NEW: Reason for manager request (only if requestedRole is MANAGER) ─
  @IsOptional()
  @IsString()
  managerReason?: string;
}