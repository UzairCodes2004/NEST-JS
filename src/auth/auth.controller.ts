import { Controller, ValidationPipe, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';        // updated DTO
import { ValidateResetTokenDto } from './dto/validate-reset-token.dto'; // updated DTO

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
}