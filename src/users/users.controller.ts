import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ParseIntPipe, ValidationPipe, Put } from '@nestjs/common';
import { CreatedUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

    //CRUD METHODS USING ARRAY


    // @Get()
    // findAll(@Query('role') role?: 'INTERN' | 'ASE' | 'SSE') {
    //     return this.userService.findAll(role)
    // }

    // // GET /users/:id anything after user/ or params any get route will be read as user/interns and the value will be stored in get  


    // // IMP INFO BELOW 

    // // ParseIntPipe not only transforms the id params but also include built in validation 


    // @Get(':id')
    // findOne(@Param('id',ParseIntPipe) id: number) {

    //     return this.userService.findOne(id);
    // }

    // // POST route which post data from the body and user is the type
    // @Post() create(@Body(ValidationPipe) user: CreatedUserDto) {
    //     return this.userService.create(user)
    // }

    // @Patch(':id')
    // update(@Param('id',ParseIntPipe) id: number, @Body(ValidationPipe) userUpdate: UpdateUserDto) {
    //     return this.userService.update(id, userUpdate as CreatedUserDto);
    // }

    // @Delete(':id')
    // delete(@Param('id',ParseIntPipe) id: number) {

    //     return this.userService.delete(id);
    // }



    // REST API WITH DATABASE INTEGRATION


    // GET ALL USERS
    @Get()
    findAll() {
        return this.userService.findAll();
    }
    // GET USER BY ID users/:id
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {

        return this.userService.findOne(id);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.userService.delete(id);
    }



    @Post()
    register(@Body(ValidationPipe) user: CreatedUserDto) {
        return this.userService.register(user);
    }


    @Put(':id')
    edit(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatedUser: UpdateUserDto) {
        return this.userService.edit(id, updatedUser)
    }

}


