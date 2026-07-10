import { Injectable } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { CommentsService } from '../comments/comments.service';
@Injectable()
export class IssuesService {
    constructor(private readonly databaseService: DatabaseService) { }



    async findAll(userId:number,userRole:string) {

        const whereCondition=userRole==='MANAGER'||'SUPERADMIN' ? {} : {userID:userId};

        const issues = await this.databaseService.issue.count()
        if (issues === 0)
            throw new NotFoundException(" Issue not found ")

        return await this.databaseService.issue.findMany({where:whereCondition,
            orderBy:{createdAT:'desc'}
        })
    }

    async findOne(id: number,userId:number,userRole:string) {
        const issueCount = await this.databaseService.issue.count({
            where: { id }
        });

        if (issueCount === 0) {
            throw new NotFoundException("Issue not found");
        }

        const issue= await this.databaseService.issue.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                status: true,
                // added so user can view there own issues
                userID:true,
                updatedByUserId:true,
                user: {
                    select: {
                        email: true,
                        name: true,
                        role: true
                    }
                },
                updatedByUser: {
                    select: {
                        email: true,
                        name: true,
                        role: true
                    }
                }
            }
        });

    // adding role check 
     if (
      userRole !== 'MANAGER' &&
      userRole !== 'SUPERADMIN' &&
      issue!.userID !== userId
    ) {
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
                userID: userId
            }
        })
    }

    async editIssue(id: number, updatedIssue: UpdateIssueDto, userId: number,userRole:string

    ) {
           const existing = await this.databaseService.issue.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing) {
      throw new NotFoundException('Issue not found');
    }

    // Allow if manager/admin OR the user owns the issue
    if (
      userRole !== 'MANAGER' &&
      userRole !== 'SUPERADMIN' &&
      existing.userID !== userId
    ) {
      throw new ForbiddenException('You do not have permission to edit this issue');
    }
        return this.databaseService.issue.update({
            where: {
                id,
            }, data: {
                ...updatedIssue,
                updatedByUserId: userId,
                updatedAT: new Date(),
            }
        })
    }
    async delete(id: number,userId:number,userRole:string) {
         const existing = await this.databaseService.issue.findUnique({
      where: { id },
      select: { userID: true },
    });

    if (!existing)
      throw new NotFoundException('Issue not found');
    
           if (
      userRole !== 'MANAGER' &&
      userRole !== 'SUPERADMIN' &&
      existing!.userID !== userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this issue');
    }

    // Cascade delete comments
    await this.databaseService.comment.deleteMany({
      where: { issueID: id },
    });
        return this.databaseService.issue.delete({
            where: { id, }

        })
    
}}
