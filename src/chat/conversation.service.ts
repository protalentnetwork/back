import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { CreateConversationDto } from './dto/conversation.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async createConversation(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      userId: createConversationDto.userId,
      title: createConversationDto.title || `Conversación de ${createConversationDto.userId}`,
      status: 'active',
    });
    return this.conversationRepository.save(conversation);
  }

  async getConversationById(id: string): Promise<Conversation> {
    return this.conversationRepository.findOne({ 
      where: { id },
      relations: ['messages'] 
    });
  }

  async getActiveConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId, status: 'active' },
      order: { updatedAt: 'DESC' },
    });
  }

  async getAllConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async assignAgentToConversation(conversationId: string, agentId: string): Promise<Conversation> {
    await this.conversationRepository.update(
      { id: conversationId },
      { agentId }
    );
    return this.getConversationById(conversationId);
  }

  async closeConversation(conversationId: string): Promise<Conversation> {
    await this.conversationRepository.update(
      { id: conversationId },
      { status: 'closed' }
    );
    return this.getConversationById(conversationId);
  }

  async getActiveConversations(): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { status: 'active' },
      order: { updatedAt: 'DESC' },
    });
  }

  async getClosedConversations(): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { status: 'closed' },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateConversationTimestamp(conversationId: string): Promise<void> {
    await this.conversationRepository.update(
      { id: conversationId },
      { updatedAt: new Date() }
    );
  }
} 