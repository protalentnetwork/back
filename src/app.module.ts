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
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './reports/report.module';
import { IpnModule } from './transactions/transactions.module';

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
    ReportModule,
    IpnModule
  ],
  controllers: [ZendeskController],
})
export class AppModule { }