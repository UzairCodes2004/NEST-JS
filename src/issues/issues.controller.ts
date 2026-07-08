import { Controller,Req, Get, ParseIntPipe, Param, Post, Body, ValidationPipe, Put, Delete } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';


@Controller('issues')
@UseGuards(AuthGuard('jwt'))
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
    // create issues 

    @Post()
  async create(@Body(ValidationPipe) issue: CreatedIssueDto, @Req() req: any) {
    const userId = req.user.id; 
    return this.issueService.create(issue, userId);
  }
// edit issues

     @Put(':id')
  async editIssue(@Param('id',ParseIntPipe) id: number,@Body() updatedIssue: UpdateIssueDto, @Req() req: any) {
    const userId = req.user.id;
    const userIdInt= parseInt(userId);
    return this.issueService.editIssue(id, updatedIssue, userIdInt);
  }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.issueService.delete(id)
    }

}
