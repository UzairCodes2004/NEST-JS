import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {JwtModule} from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { PermissionsModule } from '../common/permission/permission.module';

@Module({
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
  imports: [UsersModule,
    DatabaseModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      global:true,
      secret:process.env.JWT_SECRET,
      signOptions:{expiresIn:'3d'},
      
    }), PermissionsModule
  ]

})
export class AuthModule { }
