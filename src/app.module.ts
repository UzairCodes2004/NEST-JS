import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { IssuesService } from './issues/issues.service';
import { IssuesController } from './issues/issues.controller';
import { IssuesModule } from './issues/issues.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { AdminModule } from './admin/admin.module';
import { ManagerRequestsModule } from './manager-request/manager-request.module';
import { PermissionsModule } from './common/permission/permission.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    IssuesModule,      // ← IssuesController is registered inside IssuesModule
    AuthModule,
    CommentsModule,    // ← CommentsController is registered inside CommentsModule
    AdminModule,       // ← AdminController is registered inside AdminModule
    PermissionsModule,
  ],
  controllers: [AppController], // Only AppController
  providers: [AppService],
})
export class AppModule {}
 