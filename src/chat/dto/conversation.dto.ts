import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../entities/chat.entity';

export class CreateConversationDto {
  @ApiProperty({
    description: 'ID del usuario que inicia la conversación',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Título opcional de la conversación',
    example: 'Consulta sobre facturación',
    required: false
  })
  title?: string;
}

export class CreateConversationWithMessageDto {
  @ApiProperty({
    description: 'ID del usuario que inicia la conversación',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Título opcional de la conversación',
    example: 'Consulta sobre facturación',
    required: false
  })
  title?: string;

  @ApiProperty({
    description: 'Primer mensaje de la conversación',
    example: 'Hola, necesito ayuda con mi cuenta'
  })
  message: string;
}

export class ConversationResponseDto {
  @ApiProperty({
    description: 'ID único de la conversación',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'ID del agente asignado (si existe)',
    example: 'agent456',
    required: false
  })
  agentId?: string;

  @ApiProperty({
    description: 'Título de la conversación',
    example: 'Consulta sobre facturación',
    required: false
  })
  title?: string;

  @ApiProperty({
    description: 'Estado de la conversación',
    enum: ['active', 'closed'],
    example: 'active'
  })
  status: 'active' | 'closed';

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-02-21T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-02-21T10:30:00Z'
  })
  updatedAt: Date;
  
  @ApiProperty({
    description: 'Primer mensaje de la conversación (solo cuando se crea con mensaje)',
    required: false,
    type: () => Chat
  })
  firstMessage?: Chat;
}

export class AssignAgentToConversationDto {
  @ApiProperty({
    description: 'ID de la conversación',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  conversationId: string;

  @ApiProperty({
    description: 'ID del agente que será asignado',
    example: 'agent456'
  })
  agentId: string;
}

export class CloseConversationDto {
  @ApiProperty({
    description: 'ID de la conversación a cerrar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  conversationId: string;
} 