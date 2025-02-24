import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ChatModule } from '../chat/chat.module'; // Importar el módulo de Chat
import { UserModule } from '../users/user.module'; // Ajusta la ruta según tu estructura
import { ZendeskModule } from '../ticketing/zendesk.module'; // Ajusta la ruta según tu estructura
import { Chat } from '../chat/entities/chat.entity'; // Asegúrate de que la ruta sea correcta
import { User } from '../users/entities/user.entity'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User]), // Importa las entidades necesarias
    ChatModule, // Importa el módulo de Chat para que ChatService esté disponible
    UserModule, // Importa el módulo de User
    ZendeskModule // Importa el módulo de Zendesk
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService]
})
export class ReportModule {}