// src/admin/admin.controller.ts
import {
  Controller, Get, Post, Body,
  Patch, Param, Delete, ParseIntPipe,
  UseGuards, Req, Put, ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { UpdateIssueDto } from '../issues/dto/update-issue.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { PermissionsService, UserContext } from '../common/permission/permission.service';
import { toRole } from '../common/enums/role.enum';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ─── Helper ──────────────────────────────────────────────────────────────
  private buildUserContext(userId: number, role: string): UserContext {
    return { id: userId, role: toRole(role) };
  }

  // ─── Stats ──────────────────────────────────────────────────────────────
  @Get('stats')
  async getStats(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (
      !this.permissionsService.canAccessAdminPanel(user) &&
      !this.permissionsService.canAccessManagerPanel(user)
    ) {
      throw new ForbiddenException('You do not have permission to view stats.');
    }
    return this.adminService.getStats();
  }

  // ─── USERS ──────────────────────────────────────────────────────────────
  @Get('users')
  async getAllUsers(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewUsers(user)) {
      throw new ForbiddenException('You do not have permission to view users.');
    }
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewUsers(user)) {
      throw new ForbiddenException('You do not have permission to view users.');
    }
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canEditRole(user)) {
      throw new ForbiddenException('You do not have permission to edit user roles.');
    }
    return this.adminService.updateRole(id, toRole(dto.role));
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canDeleteUser(user)) {
      throw new ForbiddenException('You do not have permission to delete users.');
    }
    return this.adminService.deleteUser(id);
  }

  // ─── ISSUES ──────────────────────────────────────────────────────────────
  @Get('issues')
  async getAllIssues(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (
      !this.permissionsService.canAccessAdminPanel(user) &&
      !this.permissionsService.canAccessManagerPanel(user)
    ) {
      throw new ForbiddenException('You do not have permission to view all issues.');
    }
    return this.adminService.getAllIssues();
  }

  @Get('issues/:id')
  async getIssueById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    const issue = await this.adminService.getIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const issueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canViewIssue(user, issueResource)) {
      throw new ForbiddenException('You do not have permission to view this issue.');
    }
    return issue;
  }

  @Put('issues/:id')
  async updateIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @Req() req: RequestWithUser,
  ) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    const issue = await this.adminService.getIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const issueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canEditIssue(user, issueResource)) {
      throw new ForbiddenException('You do not have permission to edit this issue.');
    }
    return this.adminService.updateIssue(id, dto, req.user.id);
  }

  @Delete('issues/:id')
  async deleteIssue(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    const issue = await this.adminService.getIssueById(id);
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    const issueResource = { id: issue.id, userID: issue.userID };
    if (!this.permissionsService.canDeleteIssue(user, issueResource)) {
      throw new ForbiddenException('You do not have permission to delete this issue.');
    }
    return this.adminService.deleteIssue(id, req.user.id);
  }

  // ─── COMMENTS ────────────────────────────────────────────────────────────

  // NEW: GET a single comment by ID
  @Get('comments/:id')
  async getCommentById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    // Check if user has admin or manager panel access
    if (
      !this.permissionsService.canAccessAdminPanel(user) &&
      !this.permissionsService.canAccessManagerPanel(user)
    ) {
      throw new ForbiddenException('You do not have permission to view this comment.');
    }
    const comment = await this.adminService.getCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  @Get('comments')
  async getAllComments(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (
      !this.permissionsService.canAccessAdminPanel(user) &&
      !this.permissionsService.canAccessManagerPanel(user)
    ) {
      throw new ForbiddenException('You do not have permission to view all comments.');
    }
    return this.adminService.getAllComments();
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);

    const comment = await this.adminService.getCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const commentResource = { id: comment.id, userID: comment.userID };
    if (!this.permissionsService.canDeleteComment(user, commentResource)) {
      throw new ForbiddenException('You do not have permission to delete this comment.');
    }

    return this.adminService.deleteComment(id);
  }
}