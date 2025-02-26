import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ApiKeyService } from './apikey.service';

// Definir aquí la constante para evitar problemas de importación
export const REQUIRED_PERMISSIONS = 'requiredPermissions';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    
    if (!apiKey) {
      throw new UnauthorizedException('API Key required');
    }
    
    // Obtener los permisos requeridos para este endpoint
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    ) || [];
    
    // Validar la API key y sus permisos
    const isValid = await this.apiKeyService.validateApiKey(apiKey, requiredPermissions);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key or insufficient permissions');
    }
    
    return true;
  }
} 