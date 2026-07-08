import {  BadRequestException,  Injectable, UnauthorizedException} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginTypes } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service';
import { createHash, randomBytes } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
type SignInData = { userId: number; username: string };
type AuthResult = { accessToken: string; userId: number; userName: string };
type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string;
  name?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  // Create user with google

  async validateOrCreateGoogleUser(
    email: string,
    name: string,
  ): Promise<SignInData> {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.databaseService.users.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      user = await this.databaseService.users.create({
        data: {
          email: normalizedEmail,
          name,
          password: null,
          registered: 'GOOGLE_OAUTH',
        },
      });
    }
    return {
      userId: user.id,
      username: user.name,
    };
  }
  async validateUser(input: LoginTypes): Promise<SignInData | null> {
    const user = await this.databaseService.users.findUnique({
      where: { email: input.email },
    });

    if (!user || !user.password) {
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
  private async verifyGoogleIdToken(idToken: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = (await response.json()) as GoogleTokenInfo;
    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';
    const expiresAt = Number(payload.exp);

    if (
      payload.aud !== googleClientId ||
      !payload.email ||
      !emailVerified ||
      !Number.isFinite(expiresAt) ||
      expiresAt * 1000 <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid Google token');
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
  }

  async googleSignIn(idToken: string): Promise<AuthResult> {
    const { email, name } = await this.verifyGoogleIdToken(idToken);
    const user = await this.validateOrCreateGoogleUser(email, name);
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      username: user.username,
    });
    return { accessToken, userId: user.userId, userName: user.username };
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

  //password reset

  async resetTokenGeneration(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.databaseService.users.findFirst({
      where: { email: normalizedEmail },
    });
    if (!user) return null;

    const resetToken = randomBytes(32).toString('hex');
    const hashedResetToken = hashToken(resetToken);

    const expireTokenAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.databaseService.users.update({
      where: { id: user.id },
      data: { resetToken: hashedResetToken, tokenExpireAt: expireTokenAt },
    });

    return resetToken;
  }

  async validateResetToken(
    email: string,
    token: string,
  ): Promise<{ valid: true }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!token || token.length !== 64) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const user = await this.databaseService.users.findFirst({
      where: {
        email: normalizedEmail,
        resetToken: hashToken(token),
        tokenExpireAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    return { valid: true };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    await this.validateResetToken(email,token);
    const normalizedEmail = email.trim().toLowerCase();

    if (!token || token.length !== 64) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const hashedToken = hashToken(token);
    const user = await this.databaseService.users.findFirst({
      where: {
        email: normalizedEmail,
        resetToken: hashedToken,
        tokenExpireAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await this.databaseService.users.updateMany({
      where: {
        id: user.id,
        email: normalizedEmail,
        resetToken: hashedToken,
        tokenExpireAt: {
          gt: new Date(),
        },
      },
      data: {
        resetToken: null,
        tokenExpireAt: null,
        password: hashedPassword,
        ...(user.registered === 'GOOGLE_OAUTH'
          ? { registered: 'CREDENTIALS' as const }
          : {}),
      },
    });

    if (result.count !== 1) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    return { message: 'Password reset successfully' };
  }
  async forgotPassword(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.databaseService.users.findUnique({ where: { email } });
    if (!user)
      throw new BadRequestException("User with this email doesnt exist enter valid email");

    const normalizedEmail = email.trim().toLowerCase();
    const rawToken = await this.resetTokenGeneration(normalizedEmail);

    if (!rawToken) {
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    await this.emailService.sendPasswordResetEmail(
      normalizedEmail,
      rawToken,
      normalizedEmail,
    );

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }
}
