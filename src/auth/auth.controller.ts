import { Controller, ValidationPipe, Post, Body } from '@nestjs/common';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
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
}