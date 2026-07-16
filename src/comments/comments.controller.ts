import {
  Controller, Post, Put, Delete, Get, Body, Param, UseGuards, Req, ParseIntPipe, ForbiddenException, NotFoundException,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Request } from 'express';
import { Role, toRole } from '../common/enums/role.enum';
import { PermissionsService, UserContext, IssueResource, CommentResource } from '../common/permission/permission.service';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
    username?: string;
  };
}

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    // 1. Fetch the related issue
    const issue = await this.commentsService.findIssueRaw(dto.issueID);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 2. Check if user can comment on this issue
    const issueResource: IssueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canCreateComment(user, issueResource)) {
      throw new ForbiddenException('You do not have permission to comment on this issue');
    }

    return this.commentsService.create(dto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @Req() req: RequestWithUser,
  ) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    const comment = await this.commentsService.findOneRaw(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const commentResource: CommentResource = { id: comment.id, userID: comment.userID };
    if (!this.permissionsService.canEditComment(user, commentResource)) {
      throw new ForbiddenException('You do not have permission to edit this comment');
    }

    return this.commentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    const comment = await this.commentsService.findOneRaw(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const commentResource: CommentResource = { id: comment.id, userID: comment.userID };
    if (!this.permissionsService.canDeleteComment(user, commentResource)) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    return this.commentsService.delete(id, user.id);
  }

  @Get('issue/:issueId')
  async getCommentsForIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    // Permission is already checked when the issue itself is fetched.
    return this.commentsService.findAllForIssue(issueId);
  }
}