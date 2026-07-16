import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateIssueDto } from '../issues/dto/update-issue.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './admin.service';

interface RequestWithUser {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(@Req() req: RequestWithUser) {
    return this.adminService.getStats(req.user.role);
  }

  @Get('users')
  async getAllUsers(@Req() req: RequestWithUser) {
    return this.adminService.getAllUsers(req.user.role);
  }

  @Get('users/:id')
  getUserById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.adminService.getUserById(id, req.user.role);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.updateUserRole(id, dto.role, req.user.role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.adminService.deleteUser(id, req.user.role);
  }

  // ─── Issues ──────────────────────────────────────────────────────────────

  @Get('issues')
  async getAllIssues(@Req() req: RequestWithUser) {
    return this.adminService.getAllIssues(req.user.role);
  }

  @Get('issues/:id')
  async getIssueById(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    // ✅ Fixed: only pass id and userRole (removed req.user.id)
    return this.adminService.getIssueById(id, req.user.role);
  }

  @Put('issues/:id')
  async updateIssue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @Req() req: RequestWithUser,
  ) {
    return this.adminService.updateIssue(id, dto, req.user.role, req.user.id);
  }

  @Delete('issues/:id')
  async deleteIssue(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.adminService.deleteIssue(id, req.user.id, req.user.role);
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  @Get('comments')
  async getAllComments(@Req() req: RequestWithUser) {
    return this.adminService.getAllComments(req.user.role);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.adminService.deleteComment(id, req.user.role);
  }
}