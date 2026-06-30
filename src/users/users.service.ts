import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
@Injectable()
export class UsersService {

    private users = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'INTERN' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'ASE' },
        { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'SSE' },
        { id: 4, name: 'David Brown', email: 'david@example.com', role: 'ASE' },
        { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'INTERN' },
    ]
    // GET users or Get users through query params users?role=
    findAll(role?: 'INTERN' | 'ASE' | 'SSE') {
        const user = this.users;
        if (role) {

            const filteredUsers = user.filter(user => user.role === role)
            if(filteredUsers.length===0)
                throw new NotFoundException("No user exist with the role : "+role)
            

            return filteredUsers;
        }

        return user;

    }
    // Get user/:id
    findOne(id: number) {
        const user = this.users;
        const userById = user.filter(user => user.id === id)
        if(userById.length===0)
            throw new NotFoundException("User not found")
        return userById;
    }

    // Post users

    create(user: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {
        const userByHighestId = [...this.users].sort((a, b) => b.id - a.id)

        const newUser = {

            id: userByHighestId[0].id + 1,
            ...user
        }
        this.users.push(newUser)
        return newUser;
    }
    // PATCH method users/:id
    update(id: number, updatedUser: { name: string, email: string, role: 'INTERN' | 'ASE' | 'SSE' }) {
    
    this.users = this.users.map(user => {
        if (user.id === id) {
            return { ...user, ...updatedUser }; 
        }
        return user; 
    });

    return this.findOne(id);
}
// Delete method 
delete(id:number){
    const removedUser=this.findOne(id)
    this.users = this.users.filter(user=>user.id!==id);
     
   return removedUser;
}
}


