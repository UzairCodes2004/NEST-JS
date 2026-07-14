import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../database/database.module';
import { ManagerRequestsModule } from '../manager-request/manager-request.module';
@Module({

imports:[DatabaseModule,ManagerRequestsModule],
controllers:[UsersController],
providers:[UsersService],
exports:[UsersService]
})
export class UsersModule {}
