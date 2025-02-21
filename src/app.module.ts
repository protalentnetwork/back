import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module';
import { PaymentModule } from './payment/payment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { ZendeskController } from './ticketing/zendesk.controller';
import { ZendeskModule } from './ticketing/zendesk.module';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entities/chat.entity';

@Module({
  imports: [
    HttpModule,
    ZendeskModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
      inject: [TypeOrmConfigService],
      extraProviders: [TypeOrmConfigService],
      useFactory: async (configService: TypeOrmConfigService) => ({
        ...configService.createTypeOrmOptions(),
        entities: [Chat],
      }),
    }),
    UserModule,
    PaymentModule,
    ChatModule,
  ],
  controllers: [ZendeskController],
})
export class AppModule { }