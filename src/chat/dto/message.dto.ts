import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    description: 'ID del usuario que envía o recibe el mensaje',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Contenido del mensaje',
    example: 'Hola, ¿cómo puedo ayudarte?'
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de remitente del mensaje',
    enum: ['client', 'agent'],
    example: 'client'
  })
  sender: 'client' | 'agent';

  @ApiProperty({
    description: 'Marca de tiempo del mensaje',
    example: '2024-02-21T10:00:00Z'
  })
  timestamp?: Date;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'ID del usuario que envía el mensaje',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Contenido del mensaje',
    example: 'Necesito ayuda con mi cuenta'
  })
  message: string;
}

export class AgentMessageDto extends SendMessageDto {
  @ApiProperty({
    description: 'ID del agente que envía el mensaje',
    example: 'agent456'
  })
  agentId: string;
} 