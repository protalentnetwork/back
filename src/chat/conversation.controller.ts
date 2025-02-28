import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { 
  CreateConversationDto, 
  ConversationResponseDto, 
  AssignAgentToConversationDto, 
  CloseConversationDto,
  CreateConversationWithMessageDto
} from './dto/conversation.dto';
import { ChatResponseDto } from './dto/chat.dto';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva conversación' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversación creada exitosamente',
    type: ConversationResponseDto
  })
  async createConversation(@Body() createConversationDto: CreateConversationDto): Promise<ConversationResponseDto> {
    const conversation = await this.conversationService.createConversation(createConversationDto);
    
    // Notificar a los agentes sobre la nueva conversación
    this.chatGateway.server.emit('newConversation', conversation);
    
    return conversation;
  }

  @Post('with-message')
  @ApiOperation({ summary: 'Crear una nueva conversación y enviar el primer mensaje' })
  @ApiBody({ type: CreateConversationWithMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Conversación creada y mensaje enviado exitosamente',
    type: ConversationResponseDto
  })
  async createConversationWithMessage(@Body() data: CreateConversationWithMessageDto): Promise<ConversationResponseDto> {
    // Crear la conversación
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
    
    // Notificar a los agentes sobre la nueva conversación
    this.chatGateway.server.emit('newConversation', conversation);
    
    // Notificar sobre el nuevo mensaje
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
    
    // Añadir el mensaje a la respuesta
    return {
      ...conversation,
      firstMessage: savedMessage
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener conversaciones activas de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Conversaciones obtenidas exitosamente',
    type: [ConversationResponseDto]
  })
  async getUserConversations(@Param('userId') userId: string): Promise<ConversationResponseDto[]> {
    return this.conversationService.getActiveConversationsByUserId(userId);
  }

  @Get('user/:userId/all')
  @ApiOperation({ summary: 'Obtener todas las conversaciones de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Conversaciones obtenidas exitosamente',
    type: [ConversationResponseDto]
  })
  async getAllUserConversations(@Param('userId') userId: string): Promise<ConversationResponseDto[]> {
    return this.conversationService.getAllConversationsByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una conversación por ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversación obtenida exitosamente',
    type: ConversationResponseDto
  })
  async getConversation(@Param('id') id: string): Promise<ConversationResponseDto> {
    return this.conversationService.getConversationById(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  @ApiResponse({
    status: 200,
    description: 'Mensajes obtenidos exitosamente',
    type: ChatResponseDto
  })
  async getConversationMessages(@Param('id') id: string): Promise<ChatResponseDto> {
    const messages = await this.chatService.getMessagesByConversationId(id);
    return {
      message: 'Mensajes obtenidos exitosamente',
      data: messages
    };
  }

  @Patch(':id/assign-agent')
  @ApiOperation({ summary: 'Asignar un agente a una conversación' })
  @ApiBody({ type: AssignAgentToConversationDto })
  @ApiResponse({
    status: 200,
    description: 'Agente asignado exitosamente',
    type: ConversationResponseDto
  })
  async assignAgentToConversation(
    @Param('id') id: string,
    @Body() assignAgentDto: AssignAgentToConversationDto
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationService.assignAgentToConversation(id, assignAgentDto.agentId);
    
    // Notificar al agente sobre la asignación
    const agentSocketId = this.chatGateway['agentSockets'].get(assignAgentDto.agentId);
    if (agentSocketId) {
      const messages = await this.chatService.getMessagesByConversationId(id);
      this.chatGateway.server.to(agentSocketId).emit('assignedConversation', { 
        conversationId: id, 
        userId: conversation.userId,
        messages 
      });
    }
    
    return conversation;
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar una conversación' })
  @ApiBody({ type: CloseConversationDto })
  @ApiResponse({
    status: 200,
    description: 'Conversación cerrada exitosamente',
    type: ConversationResponseDto
  })
  async closeConversation(
    @Param('id') id: string
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationService.closeConversation(id);
    
    // Notificar sobre el cierre de la conversación
    this.chatGateway.server.emit('conversationClosed', { conversationId: id });
    
    return conversation;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las conversaciones activas' })
  @ApiResponse({
    status: 200,
    description: 'Conversaciones activas obtenidas exitosamente',
    type: [ConversationResponseDto]
  })
  async getActiveConversations(): Promise<ConversationResponseDto[]> {
    return this.conversationService.getActiveConversations();
  }

  @Get('closed')
  @ApiOperation({ summary: 'Obtener todas las conversaciones cerradas' })
  @ApiResponse({
    status: 200,
    description: 'Conversaciones cerradas obtenidas exitosamente',
    type: [ConversationResponseDto]
  })
  async getClosedConversations(): Promise<ConversationResponseDto[]> {
    return this.conversationService.getClosedConversations();
  }
} 