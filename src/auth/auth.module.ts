import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { AuthController } from './auth.controller';
import { ApiKeysModule } from './apikeys/apikey.module';
import { ApiKey } from './apikeys/entities/apikey.entity';
import { ApiKeyGuard } from './apikeys/apikey.guard';
import { ApiKeyService } from './apikeys/apikey.service';
import { ApiKeyController } from './apikeys/apikey.controller';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    TypeOrmModule.forFeature([ApiKey]),
    ApiKeysModule,
    ThrottlerModule.forRoot([{
      ttl: 60 * 15, // 15 minutes
      limit: 5, // 5 requests
    }]),
  ],
  providers: [
    AuthService,
    ApiKeyGuard,
    ApiKeyService
  ],
  controllers: [AuthController, ApiKeyController],
  exports: [AuthService, ApiKeyGuard, ApiKeyService],
})
export class AuthModule { } 