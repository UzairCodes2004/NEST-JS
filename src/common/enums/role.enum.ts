// ─── Centralized Roles & Permissions ─────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for roles and their permissions.
// The backend resolves permissions from this file.
// The frontend fetches permissions via API.

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

// ─── All possible permissions ─────────────────────────────────────────────
export enum Permission {
  // Issues
  VIEW_ISSUE = 'view:issue',
  CREATE_ISSUE = 'create:issue',
  EDIT_OWN_ISSUE = 'edit:own_issue', //  USER can only edit their own
  EDIT_ANY_ISSUE = 'edit:any_issue', //  MANAGER + SUPERADMIN can edit any
  DELETE_OWN_ISSUE = 'delete:own_issue', //  USER can delete their own
  DELETE_ANY_ISSUE = 'delete:any_issue', //  SUPERADMIN can delete any
  VIEW_ALL_ISSUES = 'view:all_issues',

  // Comments
  CREATE_COMMENT = 'create:comment',
  EDIT_OWN_COMMENT = 'edit:own_comment', //  USER can only edit their own
  EDIT_ANY_COMMENT = 'edit:any_comment', //  MANAGER + SUPERADMIN can edit any
  DELETE_OWN_COMMENT = 'delete:own_comment', //  USER can delete their own
  DELETE_ANY_COMMENT = 'delete:any_comment', //  MANAGER + SUPERADMIN can delete any
  VIEW_ALL_COMMENTS = 'view:all_comments',

  // Users
  VIEW_USERS = 'view:users',
  EDIT_USER_ROLE = 'edit:user_role',
  DELETE_USER = 'delete:user',

  // Manager Requests
  VIEW_MANAGER_REQUESTS = 'view:manager_requests',
  REVIEW_MANAGER_REQUESTS = 'review:manager_requests',

  // Admin
  ACCESS_ADMIN_PANEL = 'access:admin_panel',
  ACCESS_MANAGER_PANEL = 'access:manager_panel',
}

// ─── Role → Permissions mapping ──────────────
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.VIEW_ISSUE,
    Permission.CREATE_ISSUE,
    Permission.EDIT_OWN_ISSUE, //  USER can only edit their own issues
    Permission.DELETE_OWN_ISSUE, //  USER can only delete their own issues
    Permission.CREATE_COMMENT,
    Permission.EDIT_OWN_COMMENT, //  USER can only edit their own comments
    Permission.DELETE_OWN_COMMENT, //  USER can only delete their own comments
  ],

  [Role.MANAGER]: [
    // All USER permissions + extra
    Permission.VIEW_ISSUE,
    Permission.CREATE_ISSUE,
    Permission.EDIT_ANY_ISSUE, //  MANAGER can edit ANY issue
    Permission.DELETE_ANY_ISSUE, //  MANAGER can delete ANY issue
    Permission.VIEW_ALL_ISSUES,
    Permission.CREATE_COMMENT,
    Permission.EDIT_ANY_COMMENT, //  MANAGER can edit ANY comment
    Permission.DELETE_ANY_COMMENT, //  MANAGER can delete ANY comment
    Permission.VIEW_ALL_COMMENTS,
    Permission.ACCESS_MANAGER_PANEL,
  ],

  [Role.SUPERADMIN]: [
    // All permissions
    Permission.VIEW_ISSUE,
    Permission.CREATE_ISSUE,
    Permission.EDIT_ANY_ISSUE,
    Permission.DELETE_ANY_ISSUE,
    Permission.VIEW_ALL_ISSUES,
    Permission.CREATE_COMMENT,
    Permission.EDIT_ANY_COMMENT,
    Permission.DELETE_ANY_COMMENT,
    Permission.VIEW_ALL_COMMENTS,
    Permission.VIEW_USERS,
    Permission.EDIT_USER_ROLE,
    Permission.DELETE_USER,
    Permission.VIEW_MANAGER_REQUESTS,
    Permission.REVIEW_MANAGER_REQUESTS,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.ACCESS_MANAGER_PANEL,
  ],
};

// ─── Helper functions ─────────────────────────────────────────────────────

export const getPermissionsForRole = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  return getPermissionsForRole(role).includes(permission);
};

export const hasAnyPermission = (role: Role, permissions: Permission[]): boolean => {
  const userPermissions = getPermissionsForRole(role);
  return permissions.some((p) => userPermissions.includes(p));
};

export const hasAllPermissions = (role: Role, permissions: Permission[]): boolean => {
  const userPermissions = getPermissionsForRole(role);
  return permissions.every((p) => userPermissions.includes(p));
};

// ─── Role check helpers ──────────────────────────────────────────────────

export const isSuperAdmin = (role: string | Role): boolean => role === Role.SUPERADMIN;
export const isManager = (role: string | Role): boolean => role === Role.MANAGER;
export const isAdmin = (role: string | Role): boolean => role === Role.SUPERADMIN;
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

// ─── Get all permissions for a user context ──────────────────────────────
export interface UserPermissions {
  role: Role;
  permissions: Permission[];
}

export const getUserPermissions = (role: Role): UserPermissions => ({
  role,
  permissions: getPermissionsForRole(role),
});