import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

@Injectable()
export class IssuesService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ─── FIND ALL (filtered by role) ─────────────────────────────────────────
  async findAll(userId: number, userRole: string) {
    const whereCondition =
      userRole === 'MANAGER' || userRole === 'SUPERADMIN'
        ? {}
        : { userID: userId };

    const issues = await this.databaseService.issue.findMany({
      where: whereCondition,
      orderBy: { createdAT: 'desc' },
    });

    if (!issues.length) {
      throw new NotFoundException('No issues found');
    }
    return issues;
  }

  // ─── FIND ONE (NO permission checks) ──────────────────────────────────
  async findOne(id: number) {
    const issue = await this.databaseService.issue.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        userID: true,
        updatedByUserId: true,
        user: { select: { email: true, name: true, role: true } },
        updatedByUser: { select: { email: true, name: true, role: true } },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(issue: CreatedIssueDto, userId: number) {
    return this.databaseService.issue.create({
      data: {
        ...issue,
        updatedAT: new Date(),
        updatedByUserId: userId,
        userID: userId,
      },
    });
  }

  // ─── EDIT (NO permission checks) ───────────────────────────────────────
  async editIssue(id: number, updatedIssue: UpdateIssueDto, userId: number, _userRole: string) {
    const existing = await this.databaseService.issue.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Issue not found');
    }

    return this.databaseService.issue.update({
      where: { id },
      data: {
        ...updatedIssue,
        updatedByUserId: userId,
        updatedAT: new Date(),
      },
    });
  }

  // ─── DELETE (NO permission checks) ─────────────────────────────────────
  async delete(id: number, _userId: number, _userRole: string) {
    const existing = await this.databaseService.issue.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Issue not found');
    }

    // Cascade delete comments
    await this.databaseService.comment.deleteMany({
      where: { issueID: id },
    });

    return this.databaseService.issue.delete({ where: { id } });
  }

  // ─── Fetch raw issue data (used by controller for permission checks) ──
  async findOneRaw(id: number) {
    return this.databaseService.issue.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        userID: true,
        updatedByUserId: true,
        user: { select: { email: true, name: true, role: true } },
        updatedByUser: { select: { email: true, name: true, role: true } },
      },
    });
  }
}