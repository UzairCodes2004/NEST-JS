// centralizing roles so no hardcoded roles 
export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

// functions for role checks
export const isSuperAdmin = (role: string | Role): boolean => role === Role.SUPERADMIN;
export const isManager = (role: string | Role): boolean => role === Role.MANAGER;
export const isAdmin = (role: string | Role): boolean =>
  role === Role.SUPERADMIN ;
export const isUser = (role: string | Role): boolean => role === Role.USER;


export const toRole = (raw: string | Role): Role => {
  if (!raw) return Role.USER;
  const trimmed = raw.trim().toUpperCase();
  switch (trimmed) {
    case 'SUPERADMIN':
      return Role.SUPERADMIN;
    case 'MANAGER':
      return Role.MANAGER;
    case 'USER':
    default:
      return Role.USER;
  }
};