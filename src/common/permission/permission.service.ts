// ─── Centralized permission service ────

import { Injectable } from '@nestjs/common';
import { Role, isAdmin, isManager } from '../enums/role.enum';

// using only those fields that are necessary for permissions 
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

@Injectable()
export class PermissionsService {
  // ─── Issues ────────────

  canViewIssue(user: UserContext, issue: IssueResource): boolean {

    // Super admin and manager can view all isssues 

    if (isAdmin(user.role) || isManager(user.role)) return true;

    // USER can only view their own
    return user.id === issue.userID;
  }

  canEditIssue(user: UserContext, issue: IssueResource): boolean {
    if (isAdmin(user.role) || isManager(user.role)) return true;
    return user.id === issue.userID;
  }

  canDeleteIssue(user: UserContext, issue: IssueResource): boolean {
    // Only SUPER_ADMIN or the creator can delete
    if (user.role === Role.SUPERADMIN) return true;
    return user.id === issue.userID;
  }

  canChangeStatus(user: UserContext, issue: IssueResource): boolean {
    // manager , admin and the one that created the issue can change the status of the issue 
    return this.canEditIssue(user, issue);
  }

  // Comments 

  canViewComment(_user: UserContext, _comment: CommentResource): boolean {
    // Viewing comment is allowed if user can view the parent issue.
    // Handled by the parent issue check in the controller.
    return true;
  }

  canCreateComment(user: UserContext, issue: IssueResource): boolean {
    // to comment user should be able to see 
    return this.canViewIssue(user, issue);
  }

  canEditComment(user: UserContext, comment: CommentResource): boolean {
    if (isAdmin(user.role)|| isManager(user.role)) return true;
    return user.id === comment.userID;
  }

  canDeleteComment(user: UserContext, comment: CommentResource): boolean {
    if (isAdmin(user.role)|| isManager(user.role)) return true;
    return user.id === comment.userID;
  }
}