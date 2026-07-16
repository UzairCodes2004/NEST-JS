// src/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException,} from '@nestjs/common';
import { IssuesService } from '../issues/issues.service';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { UpdateIssueDto } from '../issues/dto/update-issue.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  // ─── USERS ────────────────────────────────────────────────────────────────

// Get all users
  async getAllUsers() {
    return this.databaseService.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        registered: true,
        issues: { select: { id: true, title: true, status: true } },
        comments: { select: { id: true, text: true, issueID: true } },
      },
    });
  }
    // GET USER BY ID 

  async getUserById(id: number) {
    return this.usersService.findOne(id);
  }
// UPDATE USER ROLE
  async updateRole(userId: number, newRole: Role) {
    const target = await this.databaseService.users.findUnique({
      where: { id: userId },
    });
    if (!target) throw new NotFoundException('User not found');

    // Prevent demoting the only SUPERADMIN
    if (target.role === Role.SUPERADMIN && newRole !== Role.SUPERADMIN) {
      const count = await this.databaseService.users.count({
        where: { role: Role.SUPERADMIN },
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

  // DELETE A USER ALSO PREVENT ADMIN DELETION IF THERE IS ONLY ONE ADMIN
  async deleteUser(userId: number) {
    const target = await this.databaseService.users.findUnique({
      where: { id: userId },
    });
    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.SUPERADMIN) {
      const count = await this.databaseService.users.count({
        where: { role: Role.SUPERADMIN },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot delete the only SUPERADMIN.');
      }
    }

    await this.databaseService.comment.deleteMany({ where: { userID: userId } });
    await this.databaseService.issue.deleteMany({ where: { userID: userId } });
    await this.databaseService.manager_requests.deleteMany({ where: { userId } });

    return this.databaseService.users.delete({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
  }

  // ─── ISSUES ──────────────────────────────────────────────────────────────

// GET ALL ISSUES

  async getAllIssues() {
    return this.databaseService.issue.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        updatedByUser: { select: { id: true, name: true, email: true, role: true } },
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

  async getIssueById(id: number) {
    return this.issuesService.findOne(id);
  }

  async updateIssue(id: number, updatedIssue: UpdateIssueDto, adminUserId: number) {
    const issue = await this.issuesService.findOne(id);
    if (!issue) throw new NotFoundException('Issue not found');

    return this.issuesService.editIssue(id, updatedIssue, adminUserId, 'ADMIN');
  }

  async deleteIssue(id: number, adminUserId: number) {
    const issue = await this.issuesService.findOne(id);
    if (!issue) throw new NotFoundException('Issue not found');

    return this.issuesService.delete(id, adminUserId, 'ADMIN');
  }

  // ─── COMMENTS ─────────────────────────────────────────────────────────────

  async getAllComments() {
    return this.databaseService.comment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        issue: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAT: 'desc' },
    });
  }
  // src/admin/admin.service.ts – add this method:

// ─── Get a single comment by ID (full data) ──────────────────────────────
async getCommentById(id: number) {
  return this.databaseService.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      issue: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

  async deleteComment(id: number) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.databaseService.comment.delete({ where: { id } });
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────

  async getStats() {
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