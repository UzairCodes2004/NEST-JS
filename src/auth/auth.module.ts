import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  JwtModule
} from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from './email/email.module';
@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersModule,
    DatabaseModule,
    EmailModule,
    JwtModule.register({
      global:true,
      secret:process.env.JWT_SECRET,
      signOptions:{expiresIn:'3d'},
      
    })
  ]

})
export class AuthModule { }
