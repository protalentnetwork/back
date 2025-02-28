// src/chat/chat.controller.ts
import { Controller, Post, Body, Get, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto, MessageDto } from './dto/message.dto';
import { ChatResponseDto, JoinChatDto } from './dto/chat.dto';
import { Chat } from './entities/chat.entity';
import { ConversationService } from './conversation.service';
import { CreateConversationWithMessageDto } from './dto/conversation.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly conversationService: ConversationService,
  ) {}

  @Post('start-chat')
  @ApiOperation({ summary: 'Iniciar un nuevo chat' })
  @ApiBody({ type: JoinChatDto })
  @ApiResponse({
    status: 200,
    description: 'Chat iniciado exitosamente',
    type: ChatResponseDto
  })
  async startChat(@Body() data: JoinChatDto): Promise<ChatResponseDto> {
    // Crear una nueva conversación para el usuario
    const conversation = await this.conversationService.createConversation({
      userId: data.userId,
      title: data.title || `Conversación de ${data.userId}`
    });
    
    // Notificar a los agentes sobre la nueva conversación
    const activeConversations = await this.conversationService.getActiveConversations();
    this.chatGateway.server.emit('activeConversations', activeConversations);
    
    return {
      message: 'Chat iniciado exitosamente',
      data: { 
        userId: data.userId,
        conversationId: conversation.id
      }
    };
  }

  @Post('send-message')
  @ApiOperation({ summary: 'Enviar un mensaje por HTTP' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Mensaje enviado exitosamente',
    type: ChatResponseDto
  })
  async sendMessage(@Body() data: SendMessageDto): Promise<ChatResponseDto> {
    console.log(`Mensaje recibido vía HTTP desde ${data.userId} en conversación ${data.conversationId}: ${data.message}`);
    
    // Verificar que la conversación existe
    const conversation = await this.conversationService.getConversationById(data.conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversación con ID ${data.conversationId} no encontrada`);
    }
    
    // Actualizar timestamp de la conversación
    await this.conversationService.updateConversationTimestamp(data.conversationId);
    
    // Guarda el mensaje en la base de datos
    const savedMessage = await this.chatService.saveMessage(
      data.userId, 
      data.message, 
      'client', 
      data.conversationId
    );
    
    // Emite el evento al WebSocket para que el dashboard lo reciba
    this.chatGateway.server.emit('newMessage', {
      userId: data.userId,
      conversationId: data.conversationId,
      message: data.message,
      sender: 'client',
      timestamp: savedMessage.timestamp,
    });

    // Si la conversación tiene un agente asignado, notificar específicamente a ese agente
    if (conversation.agentId) {
      const agentSocketId = this.chatGateway['agentSockets'].get(conversation.agentId);
      if (agentSocketId) {
        this.chatGateway.server.to(agentSocketId).emit('newMessage', {
          userId: data.userId,
          conversationId: data.conversationId,
          message: data.message,
          sender: 'client',
          timestamp: savedMessage.timestamp,
        });
      }
    }

    // Actualiza las conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    this.chatGateway.server.emit('activeConversations', activeConversations);

    return { 
      message: 'Mensaje enviado con éxito', 
      data: savedMessage 
    };
  }

  @Post('send-agent-message')
  async sendAgentMessage(
    @Body() data: { userId: string; message: string; agentId: string; conversationId: string },
  ): Promise<{ message: string; data: Chat }> {
    console.log(`Mensaje recibido vía HTTP desde agente ${data.agentId} para ${data.userId} en conversación ${data.conversationId}: ${data.message}`);
    
    // Verificar que la conversación existe
    const conversation = await this.conversationService.getConversationById(data.conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversación con ID ${data.conversationId} no encontrada`);
    }
    
    // Si la conversación no tiene un agente asignado, asignar este agente
    if (!conversation.agentId) {
      await this.conversationService.assignAgentToConversation(data.conversationId, data.agentId);
    }
    
    // Actualizar timestamp de la conversación
    await this.conversationService.updateConversationTimestamp(data.conversationId);
    
    const savedMessage = await this.chatService.saveMessage(
      data.userId, 
      data.message, 
      'agent', 
      data.conversationId, 
      data.agentId
    );

    // Emite al cliente específico
    const clientSocketId = this.chatGateway['activeChats'].get(data.userId);
    if (clientSocketId) {
      this.chatGateway.server.to(clientSocketId).emit('message', {
        sender: 'agent',
        message: data.message,
        conversationId: data.conversationId,
        timestamp: savedMessage.timestamp,
      });
    }

    // Emite al dashboard del agente
    const agentSocketId = this.chatGateway['agentSockets'].get(data.agentId);
    if (agentSocketId) {
      this.chatGateway.server.to(agentSocketId).emit('newMessage', {
        userId: data.userId,
        message: data.message,
        conversationId: data.conversationId,
        sender: 'agent',
        timestamp: savedMessage.timestamp,
      });
    }

    // Actualiza las conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    this.chatGateway.server.emit('activeConversations', activeConversations);

    return { message: 'Mensaje del agente enviado con éxito', data: savedMessage };
  }

  @Get('active-conversations')
  @ApiOperation({ summary: 'Obtener lista de conversaciones activas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversaciones activas obtenida exitosamente',
    type: ChatResponseDto
  })
  async getActiveConversations(): Promise<ChatResponseDto> {
    const activeConversations = await this.conversationService.getActiveConversations();
    return {
      message: 'Conversaciones activas obtenidas exitosamente',
      data: activeConversations
    };
  }

  @Post('start-chat-with-message')
  @ApiOperation({ summary: 'Iniciar un nuevo chat y enviar el primer mensaje' })
  @ApiBody({ type: CreateConversationWithMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Chat iniciado y mensaje enviado exitosamente',
    type: ChatResponseDto
  })
  async startChatWithMessage(@Body() data: CreateConversationWithMessageDto): Promise<ChatResponseDto> {
    // Crear una nueva conversación para el usuario
    const conversation = await this.conversationService.createConversation({
      userId: data.userId,
      title: data.title || `Conversación de ${data.userId}`
    });
    
    // Guardar el primer mensaje
    const savedMessage = await this.chatService.saveMessage(
      data.userId,
      data.message,
      'client',
      conversation.id
    );
    
    // Notificar a los agentes sobre la nueva conversación y mensaje
    this.chatGateway.server.emit('newMessage', {
      userId: data.userId,
      conversationId: conversation.id,
      message: data.message,
      sender: 'client',
      timestamp: savedMessage.timestamp,
    });
    
    // Actualizar las conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    this.chatGateway.server.emit('activeConversations', activeConversations);
    
    return {
      message: 'Chat iniciado y mensaje enviado exitosamente',
      data: { 
        userId: data.userId,
        conversationId: conversation.id,
        firstMessage: savedMessage
      }
    };
  }
}