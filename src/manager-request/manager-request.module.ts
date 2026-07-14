import { Module } from '@nestjs/common';
import { ManagerRequestsController } from './manager-request.controller';
import { ManagerRequestsService } from './manager-request.service';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../common/permission/permission.module';

@Module({
  imports: [DatabaseModule, PermissionsModule],
  controllers: [ManagerRequestsController],
  providers: [ManagerRequestsService],
  exports: [ManagerRequestsService],
})
export class ManagerRequestsModule {}