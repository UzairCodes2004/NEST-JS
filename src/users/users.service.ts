import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatedUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ManagerRequestsService } from '../manager-request/manager-request.service';
import { Role } from '../common/enums/role.enum';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly managerRequestsService: ManagerRequestsService, 
  ) {}

  async findAll() {
    const users = await this.databaseService.users.count();
    if (users === 0) {
      throw new NotFoundException('No users found');
    }

    return this.databaseService.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  // GET USER BY ID
  async findOne(id: number) {
    const users = await this.databaseService.users.count({
      where: { id },
    });
    if (users === 0) {
      throw new NotFoundException('User does not exists');
    }

    return this.databaseService.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async delete(id: number) {
    return this.databaseService.users.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  // ─── CREATING USER /users/register ──────────────────────────────────────
  async register(user: CreatedUserDto) {
    // 1. Check if user already exists
    const existingUser = await this.databaseService.users.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists. Please use a unique email.');
    }

    // 2. Hash password
    const hashed = await bcrypt.hash(user.password, 10);

    // 3. Create the user (role defaults to USER from Prisma schema)
    const newUser = await this.databaseService.users.create({
      data: {
        name: user.name,
        password: hashed,
        email: user.email,
        registered: 'CREDENTIALS',
        // role: Role.USER → defaults to USER in Prisma schema
      },
      select: {
        id: true,
        email: true,
        name: true,
        registered: true,
        role: true,
      },
    });

    // 4. If the user requested MANAGER, create a manager request
    if (user.requestedRole === Role.MANAGER) {
      await this.managerRequestsService.create(newUser.id, {
        reason: user.managerReason || 'Requested manager role during registration',
      });
    }

    return newUser;
  }

  // ─── Editing user /users/edit ────────────────────────────────────────────
  async edit(id: number, updatedUser: UpdateUserDto) {
    const { password, ...rest } = updatedUser;
    const data: UpdateUserDto = { ...rest };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return this.databaseService.users.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }
}