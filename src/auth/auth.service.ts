import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginTypes } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

type SignInData = { userId: number; username: string };
type AuthResult = { accessToken: string; userId: number; userName: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) { }


  // Create user with google 

  async validateOrCreateGoogleUser(email: string, name: string): Promise<SignInData> {

    let user = await this.databaseService.users.findUnique({
      where: { email },

    });
    if (!user) {
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await this.databaseService.users.create({
        data: {
          email,
          name,
          password: randomPassword
        }
      })
    }
    return {
      userId: user.id,
      username: user.name
    }
  }
  async validateUser(input: LoginTypes): Promise<SignInData | null> {
    const user = await this.databaseService.users.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      return null;
    }

    return {
      userId: user.id,
      username: user.name,
    };
  }

  async signIn(input: LoginTypes): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload = {
      sub: user.userId,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return {
      accessToken,
      userId: user.userId,
      userName: user.username,
    };
  }
}