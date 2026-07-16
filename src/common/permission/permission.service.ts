// ─── Centralized permission service ─────────────────────────────────────
// This service resolves permissions for users based on their role.
// It uses the centralized ROLE_PERMISSIONS mapping from role.enum.ts.
// Controllers use this service to check permissions before invoking business logic.

import { Injectable } from '@nestjs/common';
import {
  Role, Permission, hasPermission, getPermissionsForRole, isAdmin, isManager,
} from '../enums/role.enum';

// ─── Types ───────────

export interface UserContext {
  id: number;
  role: Role;
}

export interface IssueResource {
  id: number;
  userID: number;
}

export interface CommentResource {
  id: number;
  userID: number;
}

export interface UserPermissionsResponse {
  role: Role;
  permissions: Permission[];
}

@Injectable()
export class PermissionsService {
  // ─── Get all permissions for a user ────────────────────────────────────
  getUserPermissions(role: Role): UserPermissionsResponse {
    return {
      role,
      permissions: getPermissionsForRole(role),
    };
  }

  // ─── Check if a user has a specific permission ──────────────────────────
  hasPermission(user: UserContext, permission: Permission): boolean {
    return hasPermission(user.role, permission);
  }
  canEditRole(user: UserContext): boolean {
    return this.canEditUserRole(user);
  }
  // ─── Issue Permissions ──────────────────────────────────────────────────

  canViewIssue(user: UserContext, issue: IssueResource): boolean {
    // SUPERADMIN/MANAGER can view all issues
    if (this.hasPermission(user, Permission.VIEW_ALL_ISSUES)) {
      return true;
    }
    // USER can only view their own
    if (this.hasPermission(user, Permission.VIEW_ISSUE)) {
      return user.id === issue.userID;
    }
    return false;
  }

  canEditIssue(user: UserContext, issue: IssueResource): boolean {
    // Check if user can edit ANY issue (MANAGER or SUPERADMIN)
    if (this.hasPermission(user, Permission.EDIT_ANY_ISSUE)) {
      return true;
    }
    // Check if user can edit ONLY their own issue (USER)
    if (this.hasPermission(user, Permission.EDIT_OWN_ISSUE)) {
      return user.id === issue.userID;
    }
    return false;
  }

  canDeleteIssue(user: UserContext, issue: IssueResource): boolean {
    // Check if user can delete ANY issue (MANAGER or SUPERADMIN)
    if (this.hasPermission(user, Permission.DELETE_ANY_ISSUE)) {
      return true;
    }
    // Check if user can delete ONLY their own issue (USER)
    if (this.hasPermission(user, Permission.DELETE_OWN_ISSUE)) {
      return user.id === issue.userID;
    }
    return false;
  }

  canChangeStatus(user: UserContext, issue: IssueResource): boolean {
    // Same as edit – MANAGER + SUPERADMIN can change status
    return this.canEditIssue(user, issue);
  }

  // ─── Comment Permissions ──────────────────────────────────────────────────

  canViewComment(user: UserContext, _comment: CommentResource): boolean {
    // Viewing comment is allowed if user can view the parent issue.
    // The parent issue check is handled in the controller.
    return true;
  }

  canCreateComment(user: UserContext, issue: IssueResource): boolean {
    // To comment, user must be able to view the issue
    return this.canViewIssue(user, issue);
  }

  canEditComment(user: UserContext, comment: CommentResource): boolean {
    // Check if user can edit ANY comment (MANAGER or SUPERADMIN)
    if (this.hasPermission(user, Permission.EDIT_ANY_COMMENT)) {
      return true;
    }
    // Check if user can edit ONLY their own comment (USER)
    if (this.hasPermission(user, Permission.EDIT_OWN_COMMENT)) {
      return user.id === comment.userID;
    }
    return false;
  }

  canDeleteComment(user: UserContext, comment: CommentResource): boolean {
    // Check if user can delete ANY comment (MANAGER or SUPERADMIN)
    if (this.hasPermission(user, Permission.DELETE_ANY_COMMENT)) {
      return true;
    }
    // Check if user can delete ONLY their own comment (USER)
    if (this.hasPermission(user, Permission.DELETE_OWN_COMMENT)) {
      return user.id === comment.userID;
    }
    return false;
  }

  // ─── Manager Request Permissions ──────────────────────────────────────

  canViewManagerRequests(user: UserContext): boolean {
    return this.hasPermission(user, Permission.VIEW_MANAGER_REQUESTS);
  }

  canReviewManagerRequests(user: UserContext): boolean {
    return this.hasPermission(user, Permission.REVIEW_MANAGER_REQUESTS);
  }

  // ─── User Management Permissions ──────────────────────────────────────

  canViewUsers(user: UserContext): boolean {
    return this.hasPermission(user, Permission.VIEW_USERS);
  }

  canEditUserRole(user: UserContext): boolean {
    return this.hasPermission(user, Permission.EDIT_USER_ROLE);
  }

  canDeleteUser(user: UserContext): boolean {
    return this.hasPermission(user, Permission.DELETE_USER);
  }

  // ─── Admin Panel Access ────────────────────────────────────────────────

  canAccessAdminPanel(user: UserContext): boolean {
    return this.hasPermission(user, Permission.ACCESS_ADMIN_PANEL);
  }

  canAccessManagerPanel(user: UserContext): boolean {
    return this.hasPermission(user, Permission.ACCESS_MANAGER_PANEL);
  }

  // ─── Legacy helpers (kept for backward compatibility, but use permissions internally) ──

  isAdmin(role: Role): boolean {
    return isAdmin(role);
  }

  isManager(role: Role): boolean {
    return isManager(role);
  }
}