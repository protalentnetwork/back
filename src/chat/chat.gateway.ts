// src/chat/chat.gateway.ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
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

  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService
  ) {
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
    
    // Obtener conversaciones activas del usuario
    const conversations = await this.conversationService.getActiveConversationsByUserId(payload.userId);
    client.emit('userConversations', conversations);
    
    // Notificar a los agentes sobre las conversaciones activas
    const allActiveConversations = await this.conversationService.getActiveConversations();
    this.server.emit('activeConversations', allActiveConversations);
  }

  @SubscribeMessage('joinAgent')
  async handleJoinAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAgentDto
  ) {
    console.log(`Agente ${payload.agentId} se unió`);
    this.agentSockets.set(payload.agentId, client.id);
    
    // Enviar conversaciones activas al agente
    const activeConversations = await this.conversationService.getActiveConversations();
    this.server.to(client.id).emit('activeConversations', activeConversations);
  }

  @SubscribeMessage('assignAgent')
  async handleAssignAgent(@MessageBody() data: AssignAgentDto) {
    console.log(`Asignando conversación ${data.conversationId} a ${data.agentId}`);
    
    // Asignar agente a la conversación
    const conversation = await this.conversationService.getConversationById(data.conversationId);
    if (!conversation) {
      throw new WsException(`Conversación con ID ${data.conversationId} no encontrada`);
    }
    
    if (!conversation.agentId) {
      await this.conversationService.assignAgentToConversation(data.conversationId, data.agentId);
      
      // Notificar al agente sobre la asignación
      const agentSocketId = this.agentSockets.get(data.agentId);
      if (agentSocketId) {
        const messages = await this.chatService.getMessagesByConversationId(data.conversationId);
        this.server.to(agentSocketId).emit('assignedConversation', { 
          conversationId: data.conversationId, 
          userId: conversation.userId,
          messages 
        });
      }
      
      // Actualizar lista de conversaciones activas
      const activeConversations = await this.conversationService.getActiveConversations();
      this.server.emit('activeConversations', activeConversations);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: AgentMessageDto) {
    console.log(`Mensaje de agente ${data.agentId} para conversación ${data.conversationId}: ${data.message}`);
    
    // Verificar que la conversación existe
    const conversation = await this.conversationService.getConversationById(data.conversationId);
    if (!conversation) {
      throw new WsException(`Conversación con ID ${data.conversationId} no encontrada`);
    }
    
    // Si la conversación no tiene un agente asignado, asignar este agente
    if (!conversation.agentId) {
      await this.conversationService.assignAgentToConversation(data.conversationId, data.agentId);
    }
    
    // Actualizar timestamp de la conversación
    await this.conversationService.updateConversationTimestamp(data.conversationId);
    
    // Guardar el mensaje
    const savedMessage = await this.chatService.saveMessage(
      data.userId, 
      data.message, 
      'agent', 
      data.conversationId, 
      data.agentId
    );
    
    // Enviar mensaje al cliente
    const clientSocketId = this.activeChats.get(data.userId);
    if (clientSocketId) {
      this.server.to(clientSocketId).emit('message', {
        sender: 'agent',
        message: data.message,
        conversationId: data.conversationId,
        timestamp: savedMessage.timestamp,
      });
    }

    // Enviar mensaje al dashboard del agente
    const agentSocketId = this.agentSockets.get(data.agentId);
    if (agentSocketId) {
      this.server.to(agentSocketId).emit('newMessage', {
        userId: data.userId,
        message: data.message,
        conversationId: data.conversationId,
        sender: 'agent',
        timestamp: savedMessage.timestamp,
      });
    }
    
    // Actualizar lista de conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    this.server.emit('activeConversations', activeConversations);
  }

  @SubscribeMessage('selectConversation')
  async handleSelectConversation(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: { conversationId: string; agentId: string }
  ) {
    console.log(`Agente ${data.agentId} seleccionó la conversación ${data.conversationId}`);
    
    // Obtener mensajes de la conversación
    const messages = await this.chatService.getMessagesByConversationId(data.conversationId);
    client.emit('conversationMessages', { 
      conversationId: data.conversationId, 
      messages 
    });
  }

  @SubscribeMessage('clientMessage')
  async handleClientMessage(@MessageBody() data: MessageDto) {
    console.log(`Mensaje recibido de cliente ${data.userId} en conversación ${data.conversationId}: ${data.message}`);
    
    // Verificar que la conversación existe
    const conversation = await this.conversationService.getConversationById(data.conversationId);
    if (!conversation) {
      throw new WsException(`Conversación con ID ${data.conversationId} no encontrada`);
    }
    
    // Actualizar timestamp de la conversación
    await this.conversationService.updateConversationTimestamp(data.conversationId);
    
    // Guardar el mensaje
    const savedMessage = await this.chatService.saveMessage(
      data.userId, 
      data.message, 
      'client', 
      data.conversationId
    );

    // Si la conversación tiene un agente asignado, notificar específicamente a ese agente
    if (conversation.agentId) {
      const agentSocketId = this.agentSockets.get(conversation.agentId);
      if (agentSocketId) {
        this.server.to(agentSocketId).emit('newMessage', {
          userId: data.userId,
          conversationId: data.conversationId,
          message: data.message,
          sender: 'client',
          timestamp: savedMessage.timestamp,
        });
      }
    } else {
      // Si no hay agente asignado, notificar a todos los agentes
      this.server.emit('newMessage', {
        userId: data.userId,
        conversationId: data.conversationId,
        message: data.message,
        sender: 'client',
        timestamp: savedMessage.timestamp,
      });
    }

    // Actualizar lista de conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    this.server.emit('activeConversations', activeConversations);
  }

  @SubscribeMessage('archiveChat')
  async handleArchiveChat(@MessageBody() data: { userId: string; agentId: string; conversationId: string }) {
    console.log(`Archivando conversación ${data.conversationId} del usuario ${data.userId}`);
    
    // Cerrar la conversación
    await this.conversationService.closeConversation(data.conversationId);
    
    // Notificar a los agentes sobre el cambio
    const activeConversations = await this.conversationService.getActiveConversations();
    this.server.emit('activeConversations', activeConversations);
    
    // Obtener conversaciones archivadas (cerradas)
    const archivedConversations = await this.conversationService.getClosedConversations();
    
    // Emitir las conversaciones archivadas
    this.server.emit('archivedChats', archivedConversations);
  }

  @SubscribeMessage('getArchivedChats')
  async handleGetArchivedChats(@ConnectedSocket() client: Socket) {
    console.log('Obteniendo conversaciones archivadas');
    
    // Obtener conversaciones archivadas (cerradas)
    const archivedConversations = await this.conversationService.getClosedConversations();
    
    // Emitir las conversaciones archivadas al cliente que las solicitó
    client.emit('archivedChats', archivedConversations);
  }

  @SubscribeMessage('getActiveChats')
  async handleGetActiveChats(@ConnectedSocket() client: Socket) {
    console.log('Obteniendo conversaciones activas');
    
    // Obtener conversaciones activas
    const activeConversations = await this.conversationService.getActiveConversations();
    
    // Emitir las conversaciones activas al cliente que las solicitó con ambos eventos para compatibilidad
    // client.emit('activeConversations', activeConversations);
    client.emit('activeChats', activeConversations);
    
    console.log('Conversaciones activas enviadas:', JSON.stringify(activeConversations));
  }
}