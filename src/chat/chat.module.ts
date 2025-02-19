import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatConversation, ChatMessage } from './chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatConversation])
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}