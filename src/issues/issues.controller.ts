// src/issues/issues.controller.ts

import { Controller, Req, Get, ParseIntPipe, Param, Post, Body, ValidationPipe, Put, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IssuesService } from './issues.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
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
@Controller('issues')
@UseGuards(AuthGuard('jwt'))
export class IssuesController {
  constructor(private readonly issueService: IssuesService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.issueService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.issueService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  async create(@Body(ValidationPipe) issue: CreatedIssueDto, @Req() req: RequestWithUser) {
    return this.issueService.create(issue, req.user.id);
  }

  @Put(':id')
  async editIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatedIssue: UpdateIssueDto,
    @Req() req: RequestWithUser,
  ) {
    return this.issueService.editIssue(id, updatedIssue, req.user.id, req.user.role);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.issueService.delete(id, req.user.id, req.user.role);
  }
}