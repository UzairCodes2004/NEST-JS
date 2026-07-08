import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';


@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(comment: CreateCommentDto, userId: number) {
    return this.databaseService.comment.create({
      data: {
        text: comment.text,
        issueID: comment.issueID,
        userID: userId,
      },
    });
  }

  async update(id: number, updateComment: UpdateCommentDto, userId: number) {
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
  async delete(id: number, userId: number) {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
    });

    if (comment?.userID !== userId) {
      throw new Error('You can only delete your own comments');
    }

    return this.databaseService.comment.delete({ where: { id } });
  }
}