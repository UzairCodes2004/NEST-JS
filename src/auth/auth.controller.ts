import { Controller, ValidationPipe, Post, Body } from '@nestjs/common';
import { LoginTypes } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    login(@Body(ValidationPipe) input: LoginTypes) {
        return this.authService.signIn(input);
    }
}