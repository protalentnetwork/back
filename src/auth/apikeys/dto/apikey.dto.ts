import { ApiProperty } from '@nestjs/swagger';
import { API_PERMISSIONS } from '../permissions.constants';

export class CreateApiKeyDto {
    @ApiProperty({
        description: 'Nombre identificativo de la API Key',
        example: 'Integration-ClientX'
    })
    name: string;

    @ApiProperty({
        description: 'Lista de permisos asignados a esta API Key',
        example: ['zendesk:create-ticket', 'accounts:read-cbus'],
        enum: Object.values(API_PERMISSIONS),
        isArray: true
    })
    permissions: string[];

    @ApiProperty({
        description: 'Descripción detallada del propósito de esta API Key',
        example: 'API Key para integración con el sistema de tickets del cliente X',
        required: false
    })
    description?: string;

    @ApiProperty({
        description: 'Nombre del cliente o sistema que utilizará esta API Key',
        example: 'Cliente X',
        required: false
    })
    clientName?: string;

    @ApiProperty({
        description: 'Número de días hasta que expire la API Key (null = no expira)',
        example: 365,
        required: false,
        minimum: 1
    })
    expiresInDays?: number;
}

export class ApiKeyResponseDto {
    @ApiProperty({
        description: 'API Key generada (solo se muestra una vez)',
        example: 'ak_j8f3h2jf82jf82jf82jf82jf82jf82jf82jf82jf82jf82jf82j'
    })
    apiKey: string;

    @ApiProperty({
        description: 'ID único de la API Key en la base de datos',
        example: '550e8400-e29b-41d4-a716-446655440000'
    })
    id: string;
}

export class GenerateLimitedKeyDto {
    @ApiProperty({
        description: 'Nombre identificativo de la API Key limitada',
        example: 'Limited-ClientY'
    })
    name: string;

    @ApiProperty({
        description: 'Nombre del cliente que utilizará esta API Key',
        example: 'Cliente Y'
    })
    clientName: string;

    @ApiProperty({
        description: 'Descripción opcional del propósito de esta API Key',
        example: 'API Key con acceso limitado para Cliente Y',
        required: false
    })
    description?: string;
}