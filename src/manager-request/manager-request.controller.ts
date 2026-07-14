import {
  Controller,Post,Get,Put,Body,Param,ParseIntPipe,UseGuards,Req,
  ValidationPipe} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ManagerRequestsService } from './manager-request.service';
import { CreateManagerRequestDto } from './dto/create-manager-request.dto';
import { ReviewManagerRequestDto } from './dto/review-manager-request.dto';
import { Role } from '../common/enums/role.enum';
export interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: Role;
    username?: string;
  };
}

@Controller('manager-requests')
@UseGuards(AuthGuard('jwt'))
export class ManagerRequestsController {
  constructor(private readonly managerRequestsService: ManagerRequestsService) {}

  // ─── Create a manager request ──────────────────────────────────────────

  @Post()
  create(@Body(ValidationPipe) dto: CreateManagerRequestDto, @Req() req: RequestWithUser) {
    return this.managerRequestsService.create(req.user.id, dto);
  }

  // ─── Get all pending requests (SUPER_ADMIN only) ──────────────────────

  @Get('pending')
  findAllPending(@Req() req: RequestWithUser) {
    return this.managerRequestsService.findAllPending(req.user.role);
  }

  // ─── Get all requests (SUPER_ADMIN only) ──────────────────────────────

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.managerRequestsService.findAll(req.user.role);
  }

  // ─── Get requests for a specific user ──────────────────────────────────

  @Get('user/:userId')
  findUserRequests(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: RequestWithUser,
  ) {
    return this.managerRequestsService.findUserRequests(
      userId,
      req.user.id,
      req.user.role,
    );
  }

  // ─── Get current user's own requests ──────────────────────────────────

  @Get('me')
  findMyRequests(@Req() req: RequestWithUser) {
    return this.managerRequestsService.findUserRequests(
      req.user.id,
      req.user.id,
      req.user.role,
    );
  }

  // ─── Review a request (SUPER_ADMIN only) ──────────────────────────────

  @Put(':id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewManagerRequestDto,
    @Req() req: RequestWithUser,
  ) {
    return this.managerRequestsService.review(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
  }

  // ─── Get request statistics (SUPER_ADMIN only) ────────────────────────

  @Get('stats')
  getStats(@Req() req: RequestWithUser) {
    return this.managerRequestsService.getStats(req.user.role);
  }
}