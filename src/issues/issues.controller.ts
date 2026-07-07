import { Controller,Req, Get, ParseIntPipe, Param, Post, Body, ValidationPipe, Put, Delete } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
@Controller('issues')
export class IssuesController {
    constructor(private readonly issueService: IssuesService) { }

    // GET ALL THE ISSUES /issues
    @Get()
    findAll() {
        return this.issueService.findAll();

    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.issueService.findOne(id);
    }
    @Post()
    async create(@Body() dto: CreatedIssueDto, @Req() req: any) {
        return this.issueService.create(dto);
    }

    @Put(':id')
    editIssue(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatedIssue: UpdateIssueDto) {
        return this.issueService.editIssue(id, updatedIssue)
    }
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.issueService.delete(id)
    }

}
