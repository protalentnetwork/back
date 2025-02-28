import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class JoinChatDto {
  @ApiProperty({
    description: 'ID del usuario que se une al chat',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Título opcional para la conversación',
    example: 'Consulta sobre facturación',
    required: false
  })
  title?: string;
}

export class JoinAgentDto {
  @ApiProperty({
    description: 'ID del agente que se une al sistema',
    example: 'agent456'
  })
  agentId: string;
}

export class AssignAgentDto {
  @ApiProperty({
    description: 'ID de la conversación a la que se asignará el agente',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  conversationId: string;

  @ApiProperty({
    description: 'ID del usuario al que se asignará el agente',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'ID del agente que será asignado',
    example: 'agent456'
  })
  agentId: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'Mensaje de estado de la operación',
    example: 'Mensaje enviado con éxito'
  })
  message: string;

  @ApiProperty({
    description: 'Datos adicionales de la respuesta. Puede contener información del usuario, mensajes o chats activos',
    type: 'object',
    properties: {
      userId: { type: 'string', example: 'user123' },
      message: { type: 'string', example: 'Hola' },
      timestamp: { type: 'string', example: '2024-02-21T10:00:00Z' },
      activeChats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user123' },
            lastMessage: { type: 'string', example: 'Hola, necesito ayuda' }
          }
        }
      }
    },
    additionalProperties: true
  })
  data: Record<string, any>;
} 