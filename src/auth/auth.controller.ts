import {
  Controller,
  ValidationPipe,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleAuth(@Body(ValidationPipe) body: GoogleAuthDto) {
    return this.authService.googleSignIn(body.idToken);
  }

  @Post('login')
  login(@Body(ValidationPipe) input: LoginTypes) {
    return this.authService.signIn(input);
  }

  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) input: ForgotPasswordDto) {
    return this.authService.forgotPassword(input.email);
  }

  @Post('validate-reset-token')
  @HttpCode(HttpStatus.OK)
  async validateResetToken(@Body(ValidationPipe) input: ValidateResetTokenDto) {
    return this.authService.validateResetTokenWithData(input.data);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body(ValidationPipe) input: ResetPasswordDto) {
    return this.authService.resetPasswordWithData(input.data, input.newPassword);
  }

  // ─── NEW: Get current user's permissions ────────────────────────────────
  @Get('permissions/me')
  @UseGuards(AuthGuard('jwt'))
  async getMyPermissions(@Req() req: RequestWithUser) {
    return this.authService.getCurrentUserPermissions(req.user.id);
  }
}