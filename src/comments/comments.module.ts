import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { DatabaseModule } from '../database/database.module';
import { IssuesModule } from '../issues/issues.module';
import { PermissionsModule } from '../common/permission/permission.module';
@Module({
  imports:[DatabaseModule,IssuesModule,PermissionsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports:[CommentsService]
})
export class CommentsModule {}
