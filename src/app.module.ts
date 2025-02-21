import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/user.module';
import { PaymentModule } from './payment/payment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { ZendeskController } from './ticketing/zendesk.controller';
import { ZendeskModule } from './ticketing/zendesk.module';
import { ChatModule } from './chat/chat.module'; // Añadimos el ChatModule
import { ChatMessage } from './chat/chat.entity';
// Entidad para TypeORM

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
      // Aquí especificamos las entidades globalmente
      inject: [TypeOrmConfigService],
      extraProviders: [TypeOrmConfigService],
      // Añadimos la entidad ChatMessage para que TypeORM la reconozca
      useFactory: async (configService: TypeOrmConfigService) => ({
        ...configService.createTypeOrmOptions(),
        entities: [ChatMessage], // Incluimos la entidad aquí
      }),
    }),
    UserModule,
    PaymentModule,
    ChatModule, // Añadimos el ChatModule al array de imports
  ],
  controllers: [ZendeskController],
})
export class AppModule { }