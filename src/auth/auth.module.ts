import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { AuthController } from './auth.controller';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    UserModule,
    ThrottlerModule.forRoot([{
      ttl: 60 * 15, // 15 minutes
      limit: 5, // 5 requests
    }]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {} 