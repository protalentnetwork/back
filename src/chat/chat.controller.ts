// src/chat/chat.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto, MessageDto } from './dto/message.dto';
import { ChatResponseDto, JoinChatDto } from './dto/chat.dto';
import { Chat } from './entities/chat.entity';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
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
    const activeChats = await this.chatService.getActiveChats();
    this.chatGateway.server.emit('activeChats', activeChats);
    
    return {
      message: 'Chat iniciado exitosamente',
      data: { userId: data.userId }
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
    console.log(`Mensaje recibido vía HTTP desde ${data.userId}: ${data.message}`);
    // Guarda el mensaje en la base de datos
    const savedMessage = await this.chatService.saveMessage(data.userId, data.message, 'client');
    
    // Emite el evento al WebSocket para que el dashboard lo reciba
    this.chatGateway.server.emit('newMessage', {
      userId: data.userId,
      message: data.message,
      sender: 'client',
      timestamp: savedMessage.timestamp,
    });

    // Actualiza los chats activos
    const activeChats = await this.chatService.getActiveChats();
    this.chatGateway.server.emit('activeChats', activeChats);

    return { 
      message: 'Mensaje enviado con éxito', 
      data: savedMessage 
    };
  }

  @Post('send-agent-message')
  async sendAgentMessage(
    @Body() data: { userId: string; message: string; agentId: string },
  ): Promise<{ message: string; data: Chat }> {
    console.log(`Mensaje recibido vía HTTP desde agente ${data.agentId} para ${data.userId}: ${data.message}`);
    const savedMessage = await this.chatService.saveMessage(data.userId, data.message, 'agent', data.agentId);

    // Emite al cliente específico
    const clientSocketId = this.chatGateway['activeChats'].get(data.userId);
    if (clientSocketId) {
      this.chatGateway.server.to(clientSocketId).emit('message', {
        sender: 'agent',
        message: data.message,
        timestamp: savedMessage.timestamp,
      });
    }

    // Emite al dashboard del agente
    const agentSocketId = this.chatGateway['agentSockets'].get(data.agentId);
    if (agentSocketId) {
      this.chatGateway.server.to(agentSocketId).emit('newMessage', {
        userId: data.userId,
        message: data.message,
        sender: 'agent',
        timestamp: savedMessage.timestamp,
      });
    }

    // Actualiza los chats activos
    const activeChats = await this.chatService.getActiveChats();
    this.chatGateway.server.emit('activeChats', activeChats);

    return { message: 'Mensaje del agente enviado con éxito', data: savedMessage };
  }

  @Get('chats')
  @ApiOperation({ summary: 'Obtener lista de chats activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de chats activos obtenida exitosamente',
    type: ChatResponseDto
  })
  async getActiveChats(): Promise<ChatResponseDto> {
    const activeChats = await this.chatService.getActiveChats();
    return {
      message: 'Chats activos obtenidos exitosamente',
      data: activeChats
    };
  }
}