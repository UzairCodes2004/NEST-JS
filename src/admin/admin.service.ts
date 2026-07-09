import {
  Injectable, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { IssuesService } from '../issues/issues.service';
import { UsersService } from '../users/users.service';
import { CommentsService } from '../comments/comments.service';
import { DatabaseService } from '../database/database.service';
import { UpdateIssueDto } from '../issues/dto/update-issue.dto';
export type UserRole = 'SUPERADMIN' | 'MANAGER' | 'USER';

@Injectable()
export class AdminService {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) { }

  // Helper: Role check ──
  private checkRole(userRole: UserRole, allowed: UserRole[]): void {
    if (!allowed.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Required: ${allowed.join(' or ')}`,
      );
    }
  }

  // ─── USERS ─────

  // Admin-only: Get ALL users (including role, registration method)
  async getAllUsers(userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);
    return this.databaseService.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        registered: true,
        issues: {
          select: { id: true, title: true, status: true },
        },
        comments: {
          select: { id: true, text: true, issueID: true },
        },
      },
    });
  }

  //  UsersService for getting a single user (but with admin context)
  async getUserById(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);
    return this.usersService.findOne(id);
  }

  // Admin-only: Change any user's role
  async updateUserRole(userId: number, newRole: UserRole, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);

    const user = await this.databaseService.users.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Prevent demoting the only SUPERADMIN
    if (user.role === 'SUPERADMIN' && newRole !== 'SUPERADMIN') {
      const count = await this.databaseService.users.count({
        where: { role: 'SUPERADMIN' },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot demote the only SUPERADMIN.');
      }
    }

    return this.databaseService.users.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  // Admin-only: Delete any user
  // src/admin/admin.service.ts

  // ✅ Admin-only: Delete any user (with cleanup)
  async deleteUser(userId: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);

    // 1. Check if user exists
    const user = await this.databaseService.users.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // 2. Prevent deleting the last SUPERADMIN
    if (user.role === 'SUPERADMIN') {
      const count = await this.databaseService.users.count({
        where: { role: 'SUPERADMIN' },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot delete the only SUPERADMIN.');
      }
    }

    // 3. Delete all comments & issues belonging to this user
    await this.databaseService.comment.deleteMany({
      where: { userID: userId },
    });
    await this.databaseService.issue.deleteMany({
      where: { userID: userId },
    });

    // 4. Now safely delete the user
    return this.databaseService.users.delete({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
  }

  // ─── ISSUES ─────────

  // Admin-only: Get ALL issues (with comments, user details)
  async getAllIssues(userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    return this.databaseService.issue.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
        comments: {
          select: {
            id: true,
            text: true,
            createdAT: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  // Reuse IssuesService for single issue
  async getIssueById(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    return this.issuesService.findOne(id);
  }

  // Admin only: Update any issue (reuse IssuesService.editIssue)
  async updateIssue(id: number, dto: UpdateIssueDto, userRole: UserRole, adminUserId: number) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    // Reuse the existing editIssue but pass the admin's ID as the "editor"
    return this.issuesService.editIssue(id, dto, adminUserId);
  }

  // Admin only: Delete ANY issue (SUPERADMIN only)
  async deleteIssue(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']); // only SUPERADMIN can delete ANY issue
    return this.issuesService.delete(id); // ← reuse IssuesService.delete
  }

  // ─── COMMENTS ────

  // Admin only: Get ALL comments
  async getAllComments(userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    return this.databaseService.comment.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        issue: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  // Admin only: Delete ANY comment (bypass ownership check)
  async deleteComment(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);

    // Find the comment first
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    return this.databaseService.comment.delete({ where: { id } });
  }

  // ─── DASHBOARD STATS ───

  async getStats(userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);

    const [totalIssues, totalUsers, totalComments] = await Promise.all([
      this.databaseService.issue.count(),
      this.databaseService.users.count(),
      this.databaseService.comment.count(),
    ]);

    const issuesByStatus = await this.databaseService.issue.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const usersByRole = await this.databaseService.users.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    return {
      totalIssues,
      totalUsers,
      totalComments,
      issuesByStatus: issuesByStatus.map((i) => ({
        status: i.status,
        count: i._count.status,
      })),
      usersByRole: usersByRole.map((i) => ({
        role: i.role,
        count: i._count.role,
      })),
    };
  }
}