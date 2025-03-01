import { Controller, Post, Body, HttpCode, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        this.logger.debug(`Login attempt for email: ${loginDto.email}`);
        
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        
        this.logger.debug('User validated successfully');
        
        return {
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.username,
                role: user.role
            }
        };
    }
} 