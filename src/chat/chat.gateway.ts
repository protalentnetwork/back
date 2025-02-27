// src/chat/chat.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JoinChatDto, JoinAgentDto, AssignAgentDto } from './dto/chat.dto';
import { MessageDto, AgentMessageDto } from './dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: [
      'https://backoffice-casino-front-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:8000',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private activeChats: Map<string, string> = new Map();
  private agentSockets: Map<string, string> = new Map();

  constructor(private readonly chatService: ChatService) {
    console.log('ChatGateway inicializado');
  }

  afterInit() {
    console.log('WebSocket Server inicializado');
  }

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinChatDto
  ) {
    console.log(`Cliente ${payload.userId} se unió al chat`);
    this.activeChats.set(payload.userId, client.id);
    const activeChats = await this.chatService.getActiveChats();
    this.server.emit('activeChats', activeChats);

    const messages = await this.chatService.getMessagesByUserId(payload.userId);
    client.emit('messageHistory', messages);
  }

  @SubscribeMessage('joinAgent')
  async handleJoinAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAgentDto
  ) {
    console.log(`Agente ${payload.agentId} se unió`);
    this.agentSockets.set(payload.agentId, client.id);
    const activeChats = await this.chatService.getActiveChats();
    this.server.to(client.id).emit('activeChats', activeChats);
  }

  @SubscribeMessage('assignAgent')
  async handleAssignAgent(@MessageBody() data: AssignAgentDto) {
    console.log(`Asignando ${data.userId} a ${data.agentId}`);
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
  async handleMessage(@MessageBody() data: AgentMessageDto) {
    const assignedAgent = await this.chatService.getAssignedAgent(data.userId);
    // if (assignedAgent === data.agentId) {
    const savedMessage = await this.chatService.saveMessage(data.userId, data.message, 'agent', data.agentId);
    console.log(`Mensaje guardado de agente ${data.agentId}: ${data.message}`);

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
    // }
  }

  @SubscribeMessage('selectChat')
  async handleSelectChat(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string; agentId: string }) {
    console.log(`Agente ${data.agentId} seleccionó el chat ${data.userId}`);
    const messages = await this.chatService.getMessagesByUserId(data.userId);
    client.emit('chatMessages', { userId: data.userId, messages }); // Asegura que sea chatMessages
  }

  @SubscribeMessage('clientMessage')
  async handleClientMessage(@MessageBody() data: MessageDto) {
    console.log(`Mensaje recibido de cliente ${data.userId}: ${data.message}`);
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