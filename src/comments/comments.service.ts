import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { IssuesService } from '../issues/issues.service';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService,
    private readonly issueService:IssuesService
    
  ) {}

  async create(comment: CreateCommentDto, userId: number,userRole:string) {

    await this.issueService.findOne(comment.issueID, userId, userRole);

    return this.databaseService.comment.create({
      data: {
        text: comment.text,
        issueID: comment.issueID,
        userID: userId,
      },
    });
  }

  async update(id: number, updateComment: UpdateCommentDto, userId: number,userRole:string) {

   const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

        if (
      userRole !== 'MANAGER' &&
      userRole !== 'SUPERADMIN' &&
      existing.userID !== userId
    ) {
      throw new ForbiddenException('You do not have permission to edit this comment');
    }

    return this.databaseService.comment.update({
      where: { id },
      data: {
        text: updateComment.text,
        
      },
    });
  }

  async findAllForIssue(issueId: number) {
    return this.databaseService.comment.findMany({
      where: { issueID: issueId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  // deleting comment
  async delete(id: number, userId: number, userRole: string) {
    const existing = await this.databaseService.comment.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    // Allow if: manager/admin OR the user owns the comment
    if (
      userRole !== 'MANAGER' &&
      userRole !== 'SUPERADMIN' &&
      existing.userID !== userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    return this.databaseService.comment.delete({ where: { id } });
  }
}