import { Controller, ValidationPipe, Post, Body } from '@nestjs/common';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ForgotPasswordDto } from './forgotpassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }
    @Post('google')
    async googleLogin(@Body(ValidationPipe) input: GoogleAuthDto) {
        return this.authService.validateOrCreateGoogleUser(input.email, input.name)
    }
    @Post('login')
    login(@Body(ValidationPipe) input: LoginTypes) {
        return this.authService.signIn(input);
    }

    @Post('forgot-password')
async forgotPassword(@Body(ValidationPipe) input: ForgotPasswordDto) {
    return this.authService.resetTokenGeneration(input.email);
}

@Post('reset-password')
async resetPassword(@Body(ValidationPipe) input: ResetPasswordDto) {
    return this.authService.resetPassword(input);
}
}