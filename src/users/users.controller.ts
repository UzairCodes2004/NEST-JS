import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { hkdfSync } from 'crypto';

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
    @Get()
    findAll() {
        return [];
    }

    // GET /users/:id anything after user/ or params any get route will be read as user/interns and the value will be stored in get
    @Get(':id')
    findOne(@Param('id') id :string) {
        return { id };
    }
 
    // POST route which post data from the body and user is the type
    @Post() create(@Body() user:{}){
        return user
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() userUpdate: {}) {
        return { id, ...userUpdate };
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return { id };
    }
}


