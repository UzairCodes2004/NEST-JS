import {
  Injectable, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { IssuesService } from '../issues/issues.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { UpdateIssueDto } from '../issues/dto/update-issue.dto';

export type UserRole = 'SUPERADMIN' | 'MANAGER' | 'USER';

@Injectable()
export class AdminService {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  // Helper: Role check
  private checkRole(userRole: UserRole, allowed: UserRole[]): void {
    if (!allowed.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Required: ${allowed.join(' or ')}`,
      );
    }
  }

  // ─── USERS ────────────────────────────────────────────────────────────────

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

  async getUserById(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);
    return this.usersService.findOne(id);
  }

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

  async deleteUser(userId: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);

    const user = await this.databaseService.users.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'SUPERADMIN') {
      const count = await this.databaseService.users.count({
        where: { role: 'SUPERADMIN' },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot delete the only SUPERADMIN.');
      }
    }

    await this.databaseService.comment.deleteMany({
      where: { userID: userId },
    });
    await this.databaseService.issue.deleteMany({
      where: { userID: userId },
    });

    return this.databaseService.users.delete({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
  }

  // ─── ISSUES ──────────────────────────────────────────────────────────────

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

  // ✅ Fixed: `findOne` now only expects `id`
  async getIssueById(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    return this.issuesService.findOne(id);
  }

  async updateIssue(id: number, updatedIssue: UpdateIssueDto, userRole: UserRole, adminUserId: number) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    return this.issuesService.editIssue(id, updatedIssue, adminUserId, userRole);
  }

  async deleteIssue(id: number, userId: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN']);
    return this.issuesService.delete(id, userId, userRole);
  }

  // ─── COMMENTS ─────────────────────────────────────────────────────────────

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

  async deleteComment(id: number, userRole: UserRole) {
    this.checkRole(userRole, ['SUPERADMIN', 'MANAGER']);
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.databaseService.comment.delete({ where: { id } });
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────

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