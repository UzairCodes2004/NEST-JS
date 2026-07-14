// src/comments/comments.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PermissionsService, CommentResource, UserContext } from '../common/permission/permission.service';
import { IssuesService } from '../issues/issues.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { toRole } from '../common/enums/role.enum';

@Injectable()
export class CommentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly issuesService: IssuesService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: number, userRole: string) {
    // Delegate permission check to IssuesService (which uses PermissionsService)
    await this.issuesService.findOne(createCommentDto.issueID, userId, userRole);
    // If it didn't throw, user has permission

    return this.databaseService.comment.create({
      data: {
        text: createCommentDto.text,
        issueID: createCommentDto.issueID,
        userID: userId,
      },
    });
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number, userRole: string) {
    const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    const user: UserContext = { id: userId, role: toRole(userRole) };
    const resource: CommentResource = { id, userID: existing.userID };

    if (!this.permissions.canEditComment(user, resource)) {
      throw new ForbiddenException('You do not have permission to edit this comment');
    }

    return this.databaseService.comment.update({
      where: { id },
      data: { text: updateCommentDto.text },
    });
  }

  async delete(id: number, userId: number, userRole: string) {
    const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    const user: UserContext = { id: userId, role: toRole(userRole) };
    const resource: CommentResource = { id, userID: existing.userID };

    if (!this.permissions.canDeleteComment(user, resource)) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    return this.databaseService.comment.delete({ where: { id } });
  }

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
}