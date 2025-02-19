// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const ticketId = client.handshake.query.ticketId as string;

    if (ticketId) {
      client.join(`chat-${ticketId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Limpiar recursos si es necesario
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, conversationId: string) {
    client.join(`chat-${conversationId}`);
    await this.chatService.resetUnreadCount(conversationId);

    const updatedConversation = await this.chatService.getConversation(conversationId);
    this.server.emit('conversationUpdated', updatedConversation);
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(client: Socket, conversationId: string) {
    client.leave(`chat-${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { message: string; chatId: string }
  ) {
    const newMessage = await this.chatService.sendMessage(
      payload.chatId,
      payload.message
    );

    this.server.to(`chat-${payload.chatId}`).emit('newMessage', newMessage);

    return newMessage;
  }
}