import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { DatabaseModule } from '../database/database.module';
import { IssuesModule } from '../issues/issues.module';
@Module({
  imports:[DatabaseModule,IssuesModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports:[CommentsService]
})
export class CommentsModule {}
