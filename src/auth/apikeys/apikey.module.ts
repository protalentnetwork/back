import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Importaciones de los componentes de API keys
import { ApiKey } from './entities/apikey.entity';
import { ApiKeyController } from './apikey.controller';
import { ApiKeyService } from './apikey.service';
import { ApiKeyGuard } from './apikey.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ApiKey]),
  ],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyService,
    ApiKeyGuard,
  ],
  exports: [
    ApiKeyService,
    ApiKeyGuard,
  ],
})
export class ApiKeysModule {} 