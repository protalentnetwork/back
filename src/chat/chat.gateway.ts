// src/chat/chat.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: [
      'https://backoffice-casino-front-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:8000',
    ],
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private activeChats: Map<string, string> = new Map(); // userId -> socketId del cliente
  private agentSockets: Map<string, string> = new Map(); // agentId -> socketId del agente

  constructor(private readonly chatService: ChatService) { }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: { userId: string }) {
    this.activeChats.set(payload.userId, client.id);
    const activeChats = await this.chatService.getActiveChats();
    this.server.emit('activeChats', activeChats);

    const messages = await this.chatService.getMessagesByUserId(payload.userId);
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('joinAgent')
  async handleJoinAgent(@ConnectedSocket() client: Socket, @MessageBody() payload: { agentId: string }) {
    this.agentSockets.set(payload.agentId, client.id);
    const activeChats = await this.chatService.getActiveChats();
    this.server.to(client.id).emit('activeChats', activeChats);
  }

  @SubscribeMessage('assignAgent')
  async handleAssignAgent(@MessageBody() data: { userId: string; agentId: string }) {
    const assignedAgent = await this.chatService.getAssignedAgent(data.userId);
    if (!assignedAgent) {
      await this.chatService.assignAgent(data.userId, data.agentId);
      const agentSocketId = this.agentSockets.get(data.agentId);
      if (agentSocketId) {
        const messages = await this.chatService.getMessagesByUserId(data.userId);
        this.server.to(agentSocketId).emit('assignedChat', { userId: data.userId, messages });
      }
      const activeChats = await this.chatService.getActiveChats();
      this.server.emit('activeChats', activeChats);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: { userId: string; message: string; agentId: string }) {
    const assignedAgent = await this.chatService.getAssignedAgent(data.userId);
    if (assignedAgent === data.agentId) {
      const savedMessage = await this.chatService.saveMessage(data.userId, data.message, 'agent', data.agentId);

      const clientSocketId = this.activeChats.get(data.userId);
      if (clientSocketId) {
        this.server.to(clientSocketId).emit('message', {
          sender: 'agent',
          message: data.message,
          timestamp: savedMessage.timestamp,
        });
      }

      const agentSocketId = this.agentSockets.get(data.agentId);
      if (agentSocketId) {
        this.server.to(agentSocketId).emit('newMessage', {
          userId: data.userId,
          message: data.message,
          sender: 'agent',
          timestamp: savedMessage.timestamp,
        });
      }
    }
  }

  @SubscribeMessage('clientMessage')
  async handleClientMessage(@MessageBody() data: { userId: string; message: string }) {
    const savedMessage = await this.chatService.saveMessage(data.userId, data.message, 'client');
    const assignedAgent = await this.chatService.getAssignedAgent(data.userId);

    if (assignedAgent) {
      const agentSocketId = this.agentSockets.get(assignedAgent);
      if (agentSocketId) {
        this.server.to(agentSocketId).emit('newMessage', {
          userId: data.userId,
          message: data.message,
          sender: 'client',
          timestamp: savedMessage.timestamp,
        });
      }
    } else {
      this.server.emit('newMessage', {
        userId: data.userId,
        message: data.message,
        sender: 'client',
        timestamp: savedMessage.timestamp,
      });
    }

    const activeChats = await this.chatService.getActiveChats();
    this.server.emit('activeChats', activeChats);
  }
}