// src/comments/comments.controller.ts

import { Controller, Post, Put, Delete, Get, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Request } from 'express';
import { Role } from '../common/enums/role.enum';


export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: Role;
    username?: string;
  };
}
@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Body() dto: CreateCommentDto, @Req() req: RequestWithUser) {
    return this.commentsService.create(dto, req.user.id, req.user.role);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.commentsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.commentsService.delete(id, req.user.id, req.user.role);
  }

  @Get('issue/:issueId')
  async getCommentsForIssue(@Param('issueId', ParseIntPipe) issueId: number) {
    return this.commentsService.findAllForIssue(issueId);
  }
}