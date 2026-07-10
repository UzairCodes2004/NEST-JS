import { Controller, Post, Put, Delete, Get, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export interface RequestWithUser {
  user: {
    id: number;          
    email: string;      
    role: string;       
  };
}

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async create(
    @Body() dto: CreateCommentDto,@Req() req: RequestWithUser
  ) {
    const userId = req.user.id;
    const userRole=req.user.role;
    return this.commentsService.create(dto, userId,userRole);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommentDto, @Req() req: RequestWithUser
  ) {    
    const userId = req.user.id;
    const userRole=req.user.role;
    return this.commentsService.update(id, dto, userId,userRole);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser ) {
    const userId = req.user.id;
     const userRole = req.user.role;
    return this.commentsService.delete(id, userId,userRole);
  }

  @Get('issue/:issueId')async getCommentsForIssue(
    @Param('issueId', ParseIntPipe) issueId: number,
  ) {
    return this.commentsService.findAllForIssue(issueId);
  }
}