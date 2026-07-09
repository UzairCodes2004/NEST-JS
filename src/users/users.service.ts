import { ConflictException, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
    constructor(private readonly databaseService: DatabaseService) { }


    // USING ARRAY BELOW TO PERFORM CRUD OPERATION

    //     private users = [
    //         { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'INTERN' },
    //         { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'ASE' },
    //         { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'SSE' },
    //         { id: 4, name: 'David Brown', email: 'david@example.com', role: 'ASE' },
    //         { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'INTERN' },
    //     ]
    //     // GET users or Get users through query params users?role=
    //     findAll(role?: 'INTERN' | 'ASE' | 'SSE') {
    //         const user = this.users;
    //         if (role) {

    //             const filteredUsers = user.filter(user => user.role === role)
    //             if(filteredUsers.length===0)
    //                 throw new NotFoundException("No user exist with the role : "+role)


    //             return filteredUsers;
    //         }

    //         return user;

    //     }
    //     // Get user/:id
    //     findOne(id: number) {
    //         const user = this.users;
    //         const userById = user.filter(user => user.id === id)
    //         if(userById.length===0)
    //             throw new NotFoundException("User not found")
    //         return userById;
    //     }

    //     // Post users

    //     create(user: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {
    //         const userByHighestId = [...this.users].sort((a, b) => b.id - a.id)

    //         const newUser = {

    //             id: userByHighestId[0].id + 1,
    //             ...user
    //         }
    //         this.users.push(newUser)
    //         return newUser;
    //     }
    //     // PATCH method users/:id
    //     update(id: number, updatedUser: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {

    //     this.users = this.users.map(user => {
    //         if (user.id === id) {
    //             return { ...user, ...updatedUser }; 
    //         }
    //         return user; 
    //     });

    //     return this.findOne(id);
    // }
    // // Delete method 
    // delete(id:number){
    //     const removedUser=this.findOne(id)
    //     this.users = this.users.filter(user=>user.id!==id);

    //    return removedUser;
    // }



    // USING PRISMA ORM WITH MySql DATABASE TO CREATE REST ENDPOINTS FOR ISSUE TRACKER AND ALL THE ENDPOINTS WE ARE CREATING ARE ASYNC FUNCTION LIKE BELOW 

    async findAll( ) {

        const users = await this.databaseService.users.count()
        if (users === 0)
            throw new NotFoundException('No users found');

        return this.databaseService.users.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role:true
            }
        })

    }

    // GET USER BY ID 

    async findOne(id: number) {

        const users = await this.databaseService.users.count({
            where:{
                id,
            }
        })
        if(users===0)
           { throw new NotFoundException("User does not exists")
           }

        return this.databaseService.users.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                email: true,
                name: true
            }
        })
        
    }

    async delete(id: number) {
        return this.databaseService.users.delete({
            where: {
                id,
            },select:{
                id:true,
                email:true,
                name:true
            }
        })
    }

    // CREATING USER /users/register
    async register(user: CreatedUserDto) {

        const existingUser = await this.databaseService.users.findUnique({
            where: { email: user.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists. Please use a unique email.');
        }
        const hashed = await bcrypt.hash(user.password, 10)


        return this.databaseService.users.create({
            data: {
                name: user.name,
                password: hashed,
                email: user.email,
                registered:'CREDENTIALS'
            },
            select: {
                id: true,
                email: true,
                name: true,
                registered:true

            }
        });
    }

    // Editing user /users/edit

    async edit(id: number, updatedUser: UpdateUserDto) {
        const { password, ...rest } = updatedUser;
        const data: UpdateUserDto = { ...rest };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        return this.databaseService.users.update({
            where: {
                id,
            },
            data,
            select:{
                id:true,
                email:true,
                name:true
            }
        });
    }

}

