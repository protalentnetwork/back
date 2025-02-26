import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/apikey.entity';

@Injectable()
export class ApiKeyService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * Genera una API Key segura usando criptografía
   * @param length Longitud de la key (por defecto 48 caracteres)
   * @returns API Key generada
   */
  generateApiKey(length: number = 48): string {
    // Usar crypto para generar bytes aleatorios
    const randomBytes = crypto.randomBytes(length);
    // Convertir a string en base64 y eliminar caracteres no alfanuméricos
    return randomBytes.toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '')
      .slice(0, length);
  }

  /**
   * Verifica si una API Key es válida y tiene los permisos requeridos
   * @param apiKey La API Key a validar
   * @param requiredPermissions Lista de permisos requeridos
   * @returns true si la API Key es válida y tiene los permisos necesarios
   */
  async validateApiKey(apiKey: string, requiredPermissions: string[] = []): Promise<boolean> {
    // Primero intentamos la validación simple desde variables de entorno
    const simpleApiKeys = this.configService.get<string>('API_KEYS')?.split(',') || [];
    if (simpleApiKeys.includes(apiKey)) {
      return true; // Las API Keys simples tienen todos los permisos
    }

    // Si no está en las simples, buscamos en la base de datos
    const keyHash = this.hashApiKey(apiKey);
    const storedKey = await this.apiKeyRepository.findOne({ where: { keyHash, isActive: true } });
    
    if (!storedKey) {
      return false;
    }
    
    // Verificar si no ha expirado
    if (storedKey.expiresAt && new Date() > storedKey.expiresAt) {
      return false;
    }
    
    // Si no se requieren permisos específicos, cualquier clave válida es suficiente
    if (requiredPermissions.length === 0) {
      return true;
    }
    
    // Verificar que la clave tenga todos los permisos requeridos
    return requiredPermissions.every(permission => 
      storedKey.permissions.includes(permission)
    );
  }

  /**
   * Hashea una API Key para almacenamiento seguro (mejor que almacenar en texto plano)
   * @param apiKey La API Key a hashear
   * @returns Hash de la API Key
   */
  hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Crea una nueva API Key en la base de datos
   * @param name Nombre identificativo de la API Key
   * @param permissions Lista de permisos
   * @param options Opciones adicionales (descripción, cliente, expiración)
   * @returns La API Key generada (¡solo se muestra una vez!)
   */
  async createApiKey(
    name: string, 
    permissions: string[], 
    options?: { 
      description?: string, 
      clientName?: string, 
      expiresInDays?: number 
    }
  ): Promise<{ apiKey: string, id: string }> {
    // Verificar si ya existe una clave con ese nombre
    const existing = await this.apiKeyRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException(`Ya existe una API Key con el nombre "${name}"`);
    }
    
    // Generar una nueva API Key
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);
    
    // Calcular fecha de expiración si corresponde
    let expiresAt = null;
    if (options?.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
    }
    
    // Guardar en la base de datos
    const newApiKey = this.apiKeyRepository.create({
      name,
      keyHash,
      permissions,
      description: options?.description,
      clientName: options?.clientName,
      expiresAt,
      isActive: true
    });
    
    const saved = await this.apiKeyRepository.save(newApiKey);
    
    // Retornamos la clave generada (esto es lo único que se mostrará al usuario)
    return {
      apiKey,
      id: saved.id
    };
  }

  /**
   * Desactiva una API Key existente
   * @param id ID de la API Key a desactivar
   */
  async deactivateApiKey(id: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException(`API Key con ID "${id}" no encontrada`);
    }
    
    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  /**
   * Obtiene todas las API Keys (sin mostrar el hash)
   */
  async getAllApiKeys(): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const keys = await this.apiKeyRepository.find();
    // No devolvemos el hash por seguridad
    return keys.map(({ keyHash, ...rest }) => rest);
  }
} 