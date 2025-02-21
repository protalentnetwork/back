// src/chat/chat.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('send-message')
  async sendMessage(@Body() data: { userId: string; message: string }) {
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

    return { message: 'Mensaje enviado con éxito', data: savedMessage };
  }
}