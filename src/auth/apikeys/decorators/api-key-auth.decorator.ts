import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiKeyGuard, REQUIRED_PERMISSIONS } from '../apikey.guard';

// Definición local de Permissions para evitar problemas de importación
const Permissions = (...permissions: string[]) => SetMetadata(REQUIRED_PERMISSIONS, permissions);

/**
 * Decorador para proteger endpoints con autenticación por API Key
 * También aplica limitación de tasa (rate limiting) para prevenir abusos
 * @param permissions Lista de permisos requeridos para acceder al endpoint
 */
export function ApiKeyAuth(...permissions: string[]) {
  const decorators = [
    UseGuards(ApiKeyGuard, ThrottlerGuard),
    ApiHeader({
      name: 'x-api-key',
      description: 'API Key for external access',
      required: true,
    }),
  ];
  
  // Si se especifican permisos, añadimos el decorador de permisos
  if (permissions.length > 0) {
    decorators.push(Permissions(...permissions));
  }
  
  return applyDecorators(...decorators);
} 