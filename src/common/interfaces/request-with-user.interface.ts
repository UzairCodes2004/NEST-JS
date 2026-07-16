import { Request } from 'express';
export type UserRole = 'SUPERADMIN' | 'MANAGER' | 'USER';
export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}