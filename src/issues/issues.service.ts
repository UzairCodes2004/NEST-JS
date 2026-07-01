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

        return this.databaseService.issue.findMany({})
    }

    async findOne(id: number) {
        const issue = await this.databaseService.issue.count(
            {
                where: {
                    id,
                }
            }
        )
        if (issue === 0)
            throw new NotFoundException("Issue not found")
    }

    async create(issue: CreatedIssueDto) {
        return this.databaseService.issue.create({
            data: {
                ...issue
            }
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
