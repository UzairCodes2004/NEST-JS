// src/issues/issues.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { PermissionsService, IssueResource, UserContext } from '../common/permission/permission.service';
import { Role, toRole } from '../common/enums/role.enum';

@Injectable()
export class IssuesService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly permissions: PermissionsService,
    ) { }

    async findAll(userId: number, userRole: string) {
        const role = toRole(userRole);
        const whereCondition =
            role === Role.SUPERADMIN || role === Role.MANAGER
                ? {}
                : { userID: userId };

        const issues = await this.databaseService.issue.findMany({
            where: whereCondition,
            orderBy: { createdAT: 'desc' },
        });

        if (!issues.length) {
            throw new NotFoundException('No issues found');
        }
        return issues;
    }

    async findOne(id: number, userId: number, userRole: string) {
        const issue = await this.databaseService.issue.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                userID: true,
                updatedByUserId: true,
                user: { select: { email: true, name: true, role: true } },
                updatedByUser: { select: { email: true, name: true, role: true } },
            },
        });

        if (!issue) {
            throw new NotFoundException('Issue not found');
        }

        const user: UserContext = { id: userId, role: toRole(userRole) };
        const resource: IssueResource = { id: issue.id, userID: issue.userID };

        if (!this.permissions.canViewIssue(user, resource)) {
            throw new ForbiddenException('You do not have permission to view this issue');
        }

        return issue;
    }

    async create(issue: CreatedIssueDto, userId: number) {
        return this.databaseService.issue.create({
            data: {
                ...issue,
                updatedAT: new Date(),
                updatedByUserId: userId,
                userID: userId,
            },
        });
    }


    async editIssue(id: number, updatedIssue: UpdateIssueDto, userId: number, userRole: string) {
        const existing = await this.databaseService.issue.findUnique({
            where: { id },
            select: { userID: true },
        });

        if (!existing) {
            throw new NotFoundException('Issue not found');
        }

        const user: UserContext = { id: userId, role: toRole(userRole) };
        const resource: IssueResource = { id, userID: existing.userID };

        if (!this.permissions.canEditIssue(user, resource)) {
            throw new ForbiddenException('You do not have permission to edit this issue');
        }

        return this.databaseService.issue.update({
            where: { id },
            data: {
                ...updatedIssue,
                updatedByUserId: userId,
                updatedAT: new Date(),
            },
        });
    }

    async delete(id: number, userId: number, userRole: string) {
        const existing = await this.databaseService.issue.findUnique({
            where: { id },
            select: { userID: true },
        });

        if (!existing) {
            throw new NotFoundException('Issue not found');
        }

        const user: UserContext = { id: userId, role: toRole(userRole) };
        const resource: IssueResource = { id, userID: existing.userID };

        if (!this.permissions.canDeleteIssue(user, resource)) {
            throw new ForbiddenException('You do not have permission to delete this issue');
        }

        await this.databaseService.comment.deleteMany({ where: { issueID: id } });
        return this.databaseService.issue.delete({ where: { id } });
    }
}