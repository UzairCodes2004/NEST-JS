import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ManagerRequestsService } from './manager-request.service';
import { CreateManagerRequestDto } from './dto/create-manager-request.dto';
import { ReviewManagerRequestDto } from './dto/review-manager-request.dto';
import { PermissionsService, UserContext } from '../common/permission/permission.service';
import { toRole } from '../common/enums/role.enum';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('manager-requests')
@UseGuards(AuthGuard('jwt'))
export class ManagerRequestsController {
  constructor(
    private readonly managerRequestsService: ManagerRequestsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ─── Helper ──────────────────────────────────────────────────────────────
  private buildUserContext(userId: number, role: string): UserContext {
    return { id: userId, role: toRole(role) };
  }

  // ─── Create a manager request ──────────────────────────────────────────
  // Any authenticated user can create a request
  @Post()
  create(@Body(ValidationPipe) dto: CreateManagerRequestDto, @Req() req: RequestWithUser) {
    return this.managerRequestsService.create(req.user.id, dto);
  }

  // ─── Get all pending requests (SUPER_ADMIN only) ──────────────────────
  @Get('pending')
  async findAllPending(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewManagerRequests(user)) {
      throw new ForbiddenException('Only SUPER_ADMIN can view pending requests.');
    }
    return this.managerRequestsService.findAllPending();
  }

  // ─── Get all requests (SUPER_ADMIN only) ──────────────────────────────
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewManagerRequests(user)) {
      throw new ForbiddenException('Only SUPER_ADMIN can view all requests.');
    }
    return this.managerRequestsService.findAll();
  }

  // ─── Get requests for a specific user ──────────────────────────────────
  @Get('user/:userId')
  async findUserRequests(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    // Users can view their own requests; SUPER_ADMIN can view anyone's
    if (userId !== req.user.id && !this.permissionsService.canViewManagerRequests(user)) {
      throw new ForbiddenException('You can only view your own requests.');
    }
    return this.managerRequestsService.findUserRequests(userId);
  }

  // ─── Get current user's own requests ──────────────────────────────────
  @Get('me')
  async findMyRequests(@Req() req: RequestWithUser) {
    return this.managerRequestsService.findUserRequests(req.user.id);
  }

  // ─── Review a request (SUPER_ADMIN only) ──────────────────────────────
  @Put(':id/review')
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewManagerRequestDto,
    @Req() req: RequestWithUser,
  ) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canReviewManagerRequests(user)) {
      throw new ForbiddenException('Only SUPER_ADMIN can review manager requests.');
    }
    return this.managerRequestsService.review(id, req.user.id, dto);
  }

  // ─── Get request statistics (SUPER_ADMIN only) ────────────────────────
  @Get('stats')
  async getStats(@Req() req: RequestWithUser) {
    const user = this.buildUserContext(req.user.id, req.user.role);
    if (!this.permissionsService.canViewManagerRequests(user)) {
      throw new ForbiddenException('Only SUPER_ADMIN can view request statistics.');
    }
    return this.managerRequestsService.getStats();
  }
}