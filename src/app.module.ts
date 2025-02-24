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
import { AccountModule } from './account/account.module';
import { Account } from './account/entities/account.entity'; // Importa la entidad Account
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './reports/report.module';

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
    }),
    UserModule,
    PaymentModule,
    ChatModule,
    AccountModule,
    AuthModule,
    ReportModule
  ],
  controllers: [ZendeskController],
})
export class AppModule { }