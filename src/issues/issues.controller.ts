import {
  Controller,
  Req,
  Get,
  ParseIntPipe,
  Param,
  Post,
  Body,
  ValidationPipe,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { Permission } from '../common/enums/role.enum'
import { AuthGuard } from '@nestjs/passport';
import { IssuesService } from './issues.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Request } from 'express';
import { Role, toRole } from '../common/enums/role.enum';
import { PermissionsService, UserContext, IssueResource } from '../common/permission/permission.service';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: string;
    username?: string;
  };
}

@Controller('issues')
@UseGuards(AuthGuard('jwt'))
export class IssuesController {
  constructor(
    private readonly issueService: IssuesService,
    private readonly permissionsService: PermissionsService, // 👈 Inject
  ) {}

  // ─── Get all issues (filtered by permission) ────────────────────────────
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };
    // ✅ The service will filter based on the user's role/permissions
    return this.issueService.findAll(user.id, user.role);
  }

  // ─── Get single issue ──────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    // 1. Fetch the issue (without permission check)
    const issue = await this.issueService.findOneRaw(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 2. Check permission
    const resource: IssueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canViewIssue(user, resource)) {
      throw new ForbiddenException('You do not have permission to view this issue');
    }

    return issue;
  }

  // ─── Create a new issue ──────────────────────────────────────────────────
  @Post()
  async create(@Body(ValidationPipe) issueDto: CreatedIssueDto, @Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    // 1. Check if user has permission to create issues (all authenticated users do)
    if (!this.permissionsService.hasPermission(user, Permission.CREATE_ISSUE)) {
      throw new ForbiddenException('You do not have permission to create issues');
    }

    return this.issueService.create(issueDto, user.id);
  }

  // ─── Edit an issue ────────────────────────────────────────────────────────
  @Put(':id')
  async editIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatedIssue: UpdateIssueDto,
    @Req() req: RequestWithUser,
  ) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    // 1. Fetch the issue
    const issue = await this.issueService.findOneRaw(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 2. Check permission
    const resource: IssueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canEditIssue(user, resource)) {
      throw new ForbiddenException('You do not have permission to edit this issue');
    }

    // 3. Proceed with update
    return this.issueService.editIssue(id, updatedIssue, user.id, user.role);
  }

  // ─── Delete an issue ──────────────────────────────────────────────────────
  @Delete(':id')
  async deleteIssue(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user: UserContext = { id: req.user.id, role: toRole(req.user.role) };

    // 1. Fetch the issue
    const issue = await this.issueService.findOneRaw(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 2. Check permission
    const resource: IssueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canDeleteIssue(user, resource)) {
      throw new ForbiddenException('You do not have permission to delete this issue');
    }

    // 3. Proceed with deletion
    return this.issueService.delete(id, user.id, user.role);
  }
}