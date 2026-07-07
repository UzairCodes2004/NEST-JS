import { Controller, ValidationPipe, Post, Body } from '@nestjs/common';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto';
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
  async validateResetToken(@Body(ValidationPipe) input: ValidateResetTokenDto) {
    return this.authService.validateResetToken(input.email, input.token);
  }

  @Post('reset-password')
  async resetPassword(@Body(ValidationPipe) input: ResetPasswordDto) {
    return this.authService.resetPassword(
      input.email,
      input.token,
      input.newPassword,
    );
  }
}
