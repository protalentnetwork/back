// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {}

  async saveMessage(userId: string, message: string, sender: string, agentId?: string): Promise<Chat> {
    const chat = this.chatRepository.create({
      userId,
      message,
      sender,
      agentId,
    });
    return this.chatRepository.save(chat);
  }

  async getMessagesByUserId(userId: string): Promise<Chat[]> {
    return this.chatRepository.find({
      where: { userId },
      order: { timestamp: 'ASC' },
    });
  }

  async assignAgent(userId: string, agentId: string): Promise<void> {
    const existingMessages = await this.chatRepository.findOne({ where: { userId } });
    if (!existingMessages || !existingMessages.agentId) {
      await this.chatRepository.update({ userId }, { agentId });
    }
  }

  async getAssignedAgent(userId: string): Promise<string | null> {
    const message = await this.chatRepository.findOne({ where: { userId, agentId: null } });
    return message ? null : (await this.chatRepository.findOne({ where: { userId } })).agentId;
  }

  async getActiveChats(): Promise<{ userId: string; agentId: string | null }[]> {
    const messages = await this.chatRepository
      .createQueryBuilder('chat')
      .select('DISTINCT chat.userId', 'userId')
      .addSelect('chat.agentId', 'agentId')
      .getRawMany();
    return messages;
  }
}