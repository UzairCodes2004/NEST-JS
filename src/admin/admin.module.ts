import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { IssuesModule } from '../issues/issues.module';
import { CommentsModule } from '../comments/comments.module';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../database/database.module';
@Module({
  imports:[IssuesModule,CommentsModule,UsersModule,DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
