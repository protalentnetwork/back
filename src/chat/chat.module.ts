// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Chat } from './entities/chat.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationService } from './conversation.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Conversation])],
  providers: [ChatGateway, ChatService, ConversationService],
  exports: [ChatService, ConversationService]
})
export class ChatModule { }
