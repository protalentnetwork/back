import { ApiProperty } from '@nestjs/swagger';

export class StatusDistributionDto {
  @ApiProperty({ description: 'Estado del ticket' })
  name: string;

  @ApiProperty({ description: 'Cantidad de tickets en este estado' })
  value: number;
}

export class TicketsByAgentDto {
  @ApiProperty({ description: 'Nombre del agente' })
  name: string;

  @ApiProperty({ description: 'Cantidad de tickets asignados' })
  tickets: number;
}

export class TicketsTrendDto {
  @ApiProperty({ description: 'Mes (abreviado)' })
  mes: string;

  @ApiProperty({ description: 'Cantidad de tickets' })
  cantidad: number;
}

export class MessageVolumeDto {
  @ApiProperty({ description: 'Hora del día' })
  hora: string;

  @ApiProperty({ description: 'Cantidad de mensajes' })
  mensajes: number;
}

export class MessageDistributionDto {
  @ApiProperty({ description: 'Tipo de remitente (Cliente/Agente)' })
  name: string;

  @ApiProperty({ description: 'Cantidad de mensajes' })
  value: number;
}

export class ResponseTimeByAgentDto {
  @ApiProperty({ description: 'Nombre del agente' })
  name: string;

  @ApiProperty({ description: 'Tiempo promedio de respuesta en minutos' })
  tiempo: number;
}

export class LoginActivityDto {
  @ApiProperty({ description: 'Día de la semana (abreviado)' })
  dia: string;

  @ApiProperty({ description: 'Cantidad de logins' })
  logins: number;
}

export class UserRolesDto {
  @ApiProperty({ description: 'Nombre del rol' })
  name: string;

  @ApiProperty({ description: 'Cantidad de usuarios con este rol' })
  value: number;
}

export class NewUsersByMonthDto {
  @ApiProperty({ description: 'Mes (abreviado)' })
  mes: string;

  @ApiProperty({ description: 'Cantidad de nuevos usuarios' })
  cantidad: number;
}

export class MetricValueDto {
  @ApiProperty({ description: 'Valor de la métrica' })
  value: string | number;

  @ApiProperty({ description: 'Tendencia en comparación con el período anterior' })
  trend: string;

  @ApiProperty({ description: 'Si la tendencia es positiva o negativa', required: false })
  trendPositive?: boolean;
}

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total de tickets' })
  totalTickets: MetricValueDto;

  @ApiProperty({ description: 'Chats activos' })
  activeChats: MetricValueDto;

  @ApiProperty({ description: 'Total de usuarios' })
  totalUsers: MetricValueDto;

  @ApiProperty({ description: 'Tiempo promedio de respuesta' })
  avgResponseTime: MetricValueDto;
}