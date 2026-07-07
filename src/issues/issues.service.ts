import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
@Injectable()
export class IssuesService {
    constructor(private readonly databaseService: DatabaseService) { }



    async findAll() {

        const issues = await this.databaseService.issue.count()
        if (issues === 0)
            throw new NotFoundException(" Issue not found ")

        return this.databaseService.issue.findMany({
            select:{
                id:true,
                title:true,
                description:true,
                status:true,
                userID:true,
                user:{
                    select:{
                        email:true,
                        name:true,
                        role:true,
                    }
                }
            }
        })
    }

    async findOne(id: number) {
        const issueCount = await this.databaseService.issue.count({
            where: { id }
        });

        if (issueCount === 0) {
            throw new NotFoundException("Issue not found");
        }

        return this.databaseService.issue.findUnique({
            where: { id },
            select: {
                title: true,
                description: true,
                status: true,
                user: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });
    }

    async create(issue: CreatedIssueDto,) {
        return this.databaseService.issue.create({
            data: {
                ...issue,
                updatedAT: new Date(),
                 userID:1          }
        })
    }

    async editIssue(id: number, updatedIssue: UpdateIssueDto) {

        return this.databaseService.issue.update({
            where: {
                id,
            }, data: { ...updatedIssue }
        })
    }
    async delete(id: number) {
        return this.databaseService.issue.delete({
            where: { id, }

        })
    }
}
