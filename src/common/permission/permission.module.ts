import { Module } from '@nestjs/common';
import { PermissionsService } from './permission.service';

@Module({
  providers: [PermissionsService],
  exports: [PermissionsService], 
})
export class PermissionsModule {}