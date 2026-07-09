import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { DatabaseModule } from '../database/database.module';


@Module({
    imports:[DatabaseModule],
    controllers:[IssuesController],
    providers:[IssuesService],
    exports:[IssuesService]
})
export class IssuesModule {}
