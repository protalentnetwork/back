// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat.entity';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async saveMessage(userId: string, message: string, sender: string, agentId?: string): Promise<ChatMessage> {
    const chatMessage = this.chatMessageRepository.create({
      userId,
      message,
      sender,
      agentId,
    });
    return this.chatMessageRepository.save(chatMessage);
  }

  async getMessagesByUserId(userId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { userId },
      order: { timestamp: 'ASC' },
    });
  }

  async assignAgent(userId: string, agentId: string): Promise<void> {
    const existingMessages = await this.chatMessageRepository.findOne({ where: { userId } });
    if (!existingMessages || !existingMessages.agentId) {
      await this.chatMessageRepository.update({ userId }, { agentId });
    }
  }

  async getAssignedAgent(userId: string): Promise<string | null> {
    const message = await this.chatMessageRepository.findOne({ where: { userId, agentId: null } });
    return message ? null : (await this.chatMessageRepository.findOne({ where: { userId } })).agentId;
  }

  async getActiveChats(): Promise<{ userId: string; agentId: string | null }[]> {
    const messages = await this.chatMessageRepository
      .createQueryBuilder('chat')
      .select('DISTINCT chat.userId', 'userId')
      .addSelect('chat.agentId', 'agentId')
      .getRawMany();
    return messages;
  }
}