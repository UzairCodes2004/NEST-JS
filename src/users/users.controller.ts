import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreatedUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionsService, UserContext } from '../common/permission/permission.service';
import { toRole } from '../common/enums/role.enum';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ─── Helper ──────────────────────────────────────────────────────────────
  private buildUserContext(userId: number, role: string): UserContext {
    return { id: userId, role: toRole(role) };
  }

  // ─── Public Registration ────────────────────────────────────────────────
  @Post('register')
  register(@Body(ValidationPipe) user: CreatedUserDto) {
    return this.userService.register(user);
  }

  // ─── Protected Routes ────────────────────────────────────────────────────
// Find All Users
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewUsers(user)) {
      throw new ForbiddenException('You do not have permission to view all users.');
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const requestingUser = this.buildUserContext(req.user.id, req.user.role);

    // Users can view their own profile; SUPERADMIN can view any
    if (requestingUser.id !== id && !this.permissionsService.canViewUsers(requestingUser)) {
      throw new ForbiddenException('You do not have permission to view this user.');
    }

    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async edit(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatedUser: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const requestingUser = this.buildUserContext(req.user.id, req.user.role);

    // Allow if user is editing their own profile, or has permission to edit any user
    const isSelf = requestingUser.id === id;
    const canEditAny = this.permissionsService.canEditUserRole(requestingUser);

    if (!isSelf && !canEditAny) {
      throw new ForbiddenException('You do not have permission to edit this user.');
    }

    return this.userService.edit(id, updatedUser);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canDeleteUser(user)) {
      throw new ForbiddenException('You do not have permission to delete users.');
    }
    return this.userService.delete(id);
  }
}