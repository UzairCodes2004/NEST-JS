import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../common/permission/permission.module';

@Module({
    imports:[DatabaseModule,PermissionsModule],
    controllers:[IssuesController],
    providers:[IssuesService],
    exports:[IssuesService]
})
export class IssuesModule {}
