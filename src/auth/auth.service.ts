import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginTypes } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { EmailService } from './email/email.service';

type SignInData = { userId: number; username: string };
type AuthResult = { accessToken: string; userId: number; userName: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private emailService: EmailService,
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
          password: randomPassword,
          registered: 'GOOGLE_OAUTH'
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

  async resetTokenGeneration(email: string) {

    const user = await this.databaseService.users.findFirst({
      where: {
        email,
      }
    })
    if (!user)
      return null;

    const resetToken = nanoid(64);
    const hashedResetToken = await bcrypt.hash(resetToken, 10)

    const expireTokenAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.users.update({
      where: {
        email,
      },
      data: {
        resetToken: hashedResetToken,
        tokenExpireAt: expireTokenAt
      },
    })
    return resetToken
  }


  async resetPassword(email: string, token:string, newPassword: string) {


    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.databaseService.users.findUnique({
      where: { email, }

    })

    if (!user)
      return "Enter correct email user not found";

    if (!user.resetToken || !user.tokenExpireAt || new Date() > user.tokenExpireAt) {
      throw new BadRequestException("Reset token has expired or is invalid");
    }
    const tokenVerification = await bcrypt.compare(token, user.resetToken!)
    if (!tokenVerification)
      throw new BadRequestException("Invalid token, try again");

    await this.databaseService.users.update(
      {
        where: { email, },
        data: {
          resetToken: null,
          tokenExpireAt: null,
          password: hashedPassword
        }

      }
    )
    return { message: "Password reset successfully" };

  }
  async forgotPassword(email: string): Promise<{ message: string, token?: string }> {

    const rawToken = await this.resetTokenGeneration(email);

    if (!rawToken) {
      return {
        message: 'Raw token not generated',
      };
    }


    await this.emailService.sendPasswordResetEmail(email, rawToken, email);

    return {
      message: 'If an account with that email exists, a reset link has been sent.',
    };
  }
}