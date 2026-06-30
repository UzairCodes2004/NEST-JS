import { Body, Controller, Delete, Get, Param, Patch, Post, Query, } from '@nestjs/common';

import { UsersService } from './users.service';
// it will handle users routes
@Controller('users')
export class UsersController {
    // routes we want to handle below

    /*
    GET /users
    GET /users/:id
    POST /users
    PATCH /users/:id
    DELETE /users/:id
    */

    // GET /users

    // was giving duplicate function error so commented out this one

    // @Get()
    // findAll() {
    //     return [];
    // }

    // QUERY PARAMS
    // GET /users?role=admin

    // Constructor handles the user servicce does same as creating a constructor but if we have created it else where it will fetch that too

    constructor(private readonly userService: UsersService) { }
    @Get()
    findAll(@Query('role') role?: 'INTERN' | 'ASE' | 'SSE') {
        return this.userService.findAll(role)
    }

    // GET /users/:id anything after user/ or params any get route will be read as user/interns and the value will be stored in get
    @Get(':id')
    findOne(@Param('id') id: string) {
        const uId = parseInt(id)
        return this.userService.findOne(uId);
    }

    // POST route which post data from the body and user is the type
    @Post() create(@Body() user: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {
        return this.userService.create(user)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() userUpdate: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {
        const uId = parseInt(id)
        return this.userService.update(uId, userUpdate);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        const uId = parseInt(id)
        return this.userService.delete(uId);
    }
}


