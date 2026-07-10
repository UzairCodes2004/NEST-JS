import { Controller,Req, Get, ParseIntPipe, Param, Post, Body, ValidationPipe, Put, Delete } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreatedIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
export interface RequestWithUser {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('issues')
@UseGuards(AuthGuard('jwt'))
export class IssuesController {
    constructor(private readonly issueService: IssuesService) { }

    // GET ALL THE ISSUES /issues
    @Get()
    findAll(@Req() req:RequestWithUser) {
      const userId=req.user.id;
      const userRole=req.user.role;
        return this.issueService.findAll(userId,userRole);

    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
      const userId=req.user.id;
      const userRole=req.user.role;
        return this.issueService.findOne(id,userId,userRole);
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
    const userRole=req.user.role;
    const userIdInt= parseInt(userId);
    return this.issueService.editIssue(id, updatedIssue, userIdInt,userRole);
  }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number, @Req() req:RequestWithUser) {
      const userId=req.user.id;
      const userRole=req.user.role;
        return this.issueService.delete(id,userId,userRole)
    }

}
