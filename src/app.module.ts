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

@Module({
  imports: [UsersModule, DatabaseModule, IssuesModule, AuthModule, CommentsModule],
  controllers: [AppController, IssuesController],
  providers: [AppService, IssuesService],
})
export class AppModule {}
 