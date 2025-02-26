import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { Transaction } from 'src/payment/entities/transaction.entity';
import { Log } from 'src/payment/entities/log.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Account } from 'src/payment/entities/account.entity';
import { ApiKey } from 'src/auth/apikeys/entities/apikey.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST'),
      port: +this.configService.get<number>('DB_PORT')!,
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      entities: [User, Transaction, Log, Chat, Account, ApiKey],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      migrationsTableName: 'migrations',
      synchronize: false,
    };
  }
}