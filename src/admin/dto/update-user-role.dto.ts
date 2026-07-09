import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEnum(['USER', 'MANAGER', 'SUPERADMIN'])
  @IsNotEmpty()
  role!: 'USER' | 'MANAGER' | 'SUPERADMIN';
}