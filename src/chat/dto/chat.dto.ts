import { ApiProperty } from '@nestjs/swagger';

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