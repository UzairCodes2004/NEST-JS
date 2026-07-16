import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ─── CREATE (NO permission checks) ──────────────────────────────────────
  async create(createCommentDto: CreateCommentDto, userId: number) {
    return this.databaseService.comment.create({
      data: {
        text: createCommentDto.text,
        issueID: createCommentDto.issueID,
        userID: userId,
      },
    });
  }

  // ─── UPDATE (NO permission checks) ──────────────────────────────────────
  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number) {
    const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    return this.databaseService.comment.update({
      where: { id },
      data: { text: updateCommentDto.text },
    });
  }

  // ─── DELETE (NO permission checks) ──────────────────────────────────────
  async delete(id: number, userId: number) {
    const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    return this.databaseService.comment.delete({ where: { id } });
  }

  // ─── GET ALL COMMENTS FOR ISSUE ─────────────────────────────────────────
  async findAllForIssue(issueId: number) {
    return this.databaseService.comment.findMany({
      where: { issueID: issueId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  // ─── FETCH RAW (for permission checks in controller) ────────────────────

  // Fetch issue raw (for permission check in controller)
  async findIssueRaw(issueId: number) {
    return this.databaseService.issue.findUnique({
      where: { id: issueId },
      select: { id: true, userID: true },
    });
  }

  // Fetch comment raw (without permission checks)
  async findOneRaw(id: number) {
    return this.databaseService.comment.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        userID: true,
        issueID: true,
        createdAT: true,
        updatedAT: true,
      },
    });
  }
}