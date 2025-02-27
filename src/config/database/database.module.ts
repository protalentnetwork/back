import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { Transaction } from 'src/payment/entities/transaction.entity';
import { Log } from 'src/payment/entities/log.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Account as PaymentAccount } from 'src/payment/entities/account.entity';
import { Account as AccountEntity } from 'src/account/entities/account.entity';
import { ApiKey } from 'src/auth/apikeys/entities/apikey.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    console.log('TypeORM Config Service: Configuring entities...');

    // Lista completa de todas las entidades
    const entities = [
      User,
      Transaction,
      Log,
      Chat,
      PaymentAccount,
      AccountEntity,
      ApiKey,
      // Añade cualquier otra entidad que tengas
    ];

    console.log('Registering entities:', entities.map(e => e.name));

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: +this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
      entities: entities,
      synchronize: false,
      logging: true,
    };
  }
}