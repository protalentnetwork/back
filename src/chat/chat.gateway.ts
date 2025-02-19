import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';

  
  
@WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    constructor(private chatService: ChatService) {}
    handleDisconnect(client: any) {
        throw new Error('Method not implemented.');
    }
    handleConnection(client: any, ...args: any[]) {
        throw new Error('Method not implemented.');
    }
  
    @SubscribeMessage('joinConversation')
    async handleJoinConversation(client: Socket, conversationId: number) {
      client.join(`conversation-${conversationId}`);
      await this.chatService.resetUnreadCount(conversationId);
      
      const updatedConversation = await this.chatService.getConversation(conversationId);
      this.server.emit('conversationUpdated', updatedConversation);
    }
  
    @SubscribeMessage('leaveConversation')
    async handleLeaveConversation(client: Socket, conversationId: number) {
      client.leave(`conversation-${conversationId}`);
    }
  }