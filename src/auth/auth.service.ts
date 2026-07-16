import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginTypes } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { createHash, randomBytes } from 'crypto';
import { Role, toRole, Permission } from '../common/enums/role.enum';
import { PermissionsService } from '../common/permission/permission.service';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

type SignInData = {
  userId: number;
  username: string;
  role: Role;
};

// Updated: includes permissions
type AuthResult = {
  accessToken: string;
  userId: number;
  userName: string;
  role: Role;
  permissions: Permission[];
};

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
    private readonly permissionsService: PermissionsService,
  ) {}

  // ─── Promote to SUPERADMIN if email is in whitelist ────────────────────

  private async promoteToSuperAdminIfEligible(email: string, userId: number): Promise<void> {
    const superAdminEmails = process.env.SUPERADMIN_EMAILS
      ?.split(',')
      .map(e => e.trim().toLowerCase()) || [];

    const normalizedEmail = email.trim().toLowerCase();

    if (superAdminEmails.includes(normalizedEmail)) {
      const user = await this.databaseService.users.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user && user.role !== Role.SUPERADMIN) {
        await this.databaseService.users.update({
          where: { id: userId },
          data: { role: Role.SUPERADMIN },
        });
        console.log(`✅ User ${email} promoted to SUPERADMIN`);
      }
    }
  }

  // ─── Google OAuth ────────────────────────────────────────────────────────

  async validateOrCreateGoogleUser(email: string, name: string): Promise<SignInData> {
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
          role: Role.USER,
        },
      });
    }

    await this.promoteToSuperAdminIfEligible(normalizedEmail, user.id);

    const updatedUser = await this.databaseService.users.findUnique({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new Error('User not found after promotion');
    }

    return {
      userId: updatedUser.id,
      username: updatedUser.name,
      role: toRole(updatedUser.role),
    };
  }

  // ─── Credentials Login ──────────────────────────────────────────────────

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

    await this.promoteToSuperAdminIfEligible(user.email, user.id);

    const updatedUser = await this.databaseService.users.findUnique({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new Error('User not found after promotion');
    }

    return {
      userId: updatedUser.id,
      username: updatedUser.name,
      role: toRole(updatedUser.role),
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

  // ─── GOOGLE SIGN IN (updated with permissions) ─────────────────────────

  async googleSignIn(idToken: string): Promise<AuthResult> {
    const { email, name } = await this.verifyGoogleIdToken(idToken);
    const user = await this.validateOrCreateGoogleUser(email, name);

    //  Get permissions for the user's role
    const permissions = this.permissionsService.getUserPermissions(user.role);

    //  Include permissions in JWT payload
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      username: user.username,
      role: user.role,
      permissions: permissions.permissions, //  Add permissions
    });

    //  Return permissions in response
    return {
      accessToken,
      userId: user.userId,
      userName: user.username,
      role: user.role,
      permissions: permissions.permissions, //  Add permissions
    };
  }

  // ─── CREDENTIALS SIGN IN (updated with permissions) ────────────────────

  async signIn(input: LoginTypes): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //  Get permissions for the user's role
    const permissions = this.permissionsService.getUserPermissions(user.role);

    
    //  Include permissions in JWT payload
    const tokenPayload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
      permissions: permissions.permissions, //  Add permissions
    };

    
    const accessToken = await this.jwtService.signAsync(tokenPayload);

    //  Return permissions in response
    return {
      accessToken,
      userId: user.userId,
      userName: user.username,
      role: user.role,
      permissions: permissions.permissions, // Add permissions
    };
  }

  // ─── Password Reset ──────────────────────────────────────────────────────

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

  async validateResetToken(email: string, token: string): Promise<{ valid: true }> {
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
    await this.validateResetToken(email, token);
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

    if (!user.password) {
      throw new BadRequestException('Unable to validate current password');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as your current password.');
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

  async forgotPassword(email: string): Promise<{ message: string; token?: string }> {
    const user = await this.databaseService.users.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User with this email does not exist. Enter a valid email.');
    }

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

  private decodeResetData(encoded: string): { email: string; token: string } {
    try {
      const base64 = decodeURIComponent(encoded);
      const json = Buffer.from(base64, 'base64').toString('utf-8');
      const parsed = JSON.parse(json);
      if (parsed.email && parsed.token) {
        return { email: parsed.email, token: parsed.token };
      }
      throw new Error('Missing email or token in payload');
    } catch (error) {
      throw new BadRequestException(
        'Invalid reset data format. Please request a new reset link.',
      );
    }
  }

  async validateResetTokenWithData(data: string): Promise<{ valid: boolean; email?: string }> {
    const { email, token } = this.decodeResetData(data);
    try {
      await this.validateResetToken(email, token);
      return { valid: true, email };
    } catch (error) {
      return { valid: false };
    }
  }

  async resetPasswordWithData(data: string, newPassword: string): Promise<{ message: string }> {
    const { email, token } = this.decodeResetData(data);
    return await this.resetPassword(email, token, newPassword);
  }

  // ─── Get current user's permissions ────────────────────────────────────

  async getCurrentUserPermissions(userId: number): Promise<{ role: Role; permissions: Permission[] }> {
    const user = await this.databaseService.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const role = toRole(user.role);
    return this.permissionsService.getUserPermissions(role);
  }
}