import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PermissionsService, UserContext } from '../common/permission/permission.service';
import { Role, toRole } from '../common/enums/role.enum';
import { CreateManagerRequestDto } from './dto/create-manager-request.dto';
import { ReviewManagerRequestDto, ReviewAction } from './dto/review-manager-request.dto';

@Injectable()
export class ManagerRequestsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissions: PermissionsService,
  ) { }

  // ─── Create a manager request ──────────────────────────────────────────

  async create(userId: number, dto: CreateManagerRequestDto) {
    // Check if user already has ANY manager request (pending, approved, rejected)
    const existingRequest = await this.databaseService.manager_requests.findFirst({
      where: { userId },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a manager request. Only one request is allowed.');
    }

    // Check if user is already a manager or super admin
    const user = await this.databaseService.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.MANAGER || user.role === Role.SUPERADMIN) {
      throw new BadRequestException('You are already a manager or super admin.');
    }

    return this.databaseService.manager_requests.create({
      data: {
        userId,
        status: 'PENDING',
        notes: dto.reason,
        // Store experience in notes or add a separate field if needed
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // ─── Get all pending requests (SUPER_ADMIN only) ──────────────────────

  async findAllPending(reviewerRole: string) {
    const role = toRole(reviewerRole);
    if (role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view pending requests.');
    }

    return this.databaseService.manager_requests.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            registered: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Get all requests (including history) 

  async findAll(reviewerRole: string) {
    const role = toRole(reviewerRole);
    if (role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view all requests.');
    }

    return this.databaseService.manager_requests.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            registered: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get requests for a specific user ──────────────────────────────────

  async findUserRequests(userId: number, requestingUserId: number, requestingUserRole: string) {
    const role = toRole(requestingUserRole);
    // Users can view their own requests; SUPER_ADMIN can view anyone's
    if (userId !== requestingUserId && role !== Role.SUPERADMIN) {
      throw new ForbiddenException('You can only view your own requests.');
    }

    return this.databaseService.manager_requests.findMany({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Review a manager request ──────────────────────────────────────────

  async review(
    requestId: number,
    reviewerUserId: number,
    reviewerUserRole: string,
    dto: ReviewManagerRequestDto,
  ) {
    const role = toRole(reviewerUserRole);
    if (role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can review manager requests.');
    }

    const request = await this.databaseService.manager_requests.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Manager request not found.');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`This request has already been ${request.status.toLowerCase()}.`);
    }

    // Prevent SUPER_ADMIN from approving/rejecting their own request
    if (request.userId === reviewerUserId) {
      throw new ForbiddenException('You cannot review your own manager request.');
    }

    const isApproved = dto.action === ReviewAction.APPROVE;

    // Start a transaction to update both the request and the user
    const [updatedRequest] = await this.databaseService.$transaction([
      // Update the request status
      this.databaseService.manager_requests.update({
        where: { id: requestId },
        data: {
          status: isApproved ? 'APPROVED' : 'REJECTED',
          reviewedBy: reviewerUserId,
          reviewedAt: new Date(),
          notes: dto.notes || request.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // If approved, update the user's role to MANAGER
    if (isApproved) {
      await this.databaseService.users.update({
        where: { id: request.userId },
        data: { role: Role.MANAGER },
      });
    }

    return updatedRequest;
  }

  // ─── Get statistics for dashboard ──────────────────────────────────────

  async getStats(reviewerRole: string) {
    const role = toRole(reviewerRole);
    if (role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view request statistics.');
    }

    const [pending, approved, rejected, total] = await Promise.all([
      this.databaseService.manager_requests.count({ where: { status: 'PENDING' } }),
      this.databaseService.manager_requests.count({ where: { status: 'APPROVED' } }),
      this.databaseService.manager_requests.count({ where: { status: 'REJECTED' } }),
      this.databaseService.manager_requests.count(),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }
}