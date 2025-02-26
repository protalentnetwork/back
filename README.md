# Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Generar una nueva migración basada en los cambios en las entidades

```bash
npm run migration:generate -- src/migrations/NombreMigracion
```

## Crear una migración vacía para escribir manualmente

```bash
npm run migration:create -- src/migrations/NombreMigracion
```

## Ejecutar las migraciones pendientes

```bash
npm run migration:run
```

## Revertir la última migración

```bash
npm run migration:revert

```

## API Keys para acceso externo

Este proyecto implementa un sistema seguro de API Keys que permite a clientes externos acceder a endpoints específicos con permisos controlados.

### Configuración y seguridad

1. Las API Keys se almacenan de forma segura en la base de datos utilizando hashing criptográfico.
2. Cada API Key tiene permisos específicos y granulares, limitando el acceso solo a los endpoints necesarios.
3. Las API Keys pueden configurarse con fecha de expiración para garantizar la rotación periódica.
4. **IMPORTANTE**: Nunca almacene ni transmita API Keys en código fuente, repositorios públicos o canales no seguros.

### Administración de API Keys

El sistema incluye endpoints protegidos para administrar las API Keys:

1. **Crear una nueva API Key**:
   ```bash
   curl -X POST https://api.ejemplo.com/api-keys \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {JWT_TOKEN}" \
     -d '{
       "name": "Cliente Externo",
       "permissions": ["zendesk:create-ticket", "accounts:read-cbus"],
       "clientName": "Nombre del Cliente",
       "description": "API Key para acceso externo",
       "expiresInDays": 90
     }'
   ```

2. **Crear una API Key limitada específica**:
   ```bash
   curl -X POST https://api.ejemplo.com/api-keys/generate-limited-key \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {JWT_TOKEN}" \
     -d '{
       "name": "Cliente Externo Limitado",
       "clientName": "Nombre del Cliente"
     }'
   ```

### Generación segura de API Keys

El sistema utiliza algoritmos criptográficos para generar API Keys seguras:

```typescript
// Inyectar el servicio donde sea necesario
constructor(private apiKeyService: ApiKeyService) {}

// Generar una nueva API Key
const newApiKey = this.apiKeyService.generateApiKey();
```

Las API Keys generadas tienen 48 caracteres por defecto y son criptográficamente seguras.

### Uso para clientes externos

Para acceder a los endpoints protegidos, los clientes externos deben:

1. Transmitir todas las solicitudes a través de HTTPS (nunca HTTP).
2. Incluir el header `x-api-key` en sus solicitudes HTTP.
3. Ejemplo de solicitud con cURL:
   ```bash
   curl -X POST https://api.ejemplo.com/zendesk/create-ticket \
     -H "Content-Type: application/json" \
     -H "x-api-key: {YOUR_API_KEY}" \
     -d '{"subject": "Nuevo ticket", "comment": {"body": "Descripción del problema"}}'
   ```

### Endpoints disponibles para acceso externo

Los siguientes endpoints están disponibles para acceso externo mediante API Key:

- `POST /zendesk/create-ticket` - Crear un nuevo ticket en el sistema de soporte (requiere permiso `zendesk:create-ticket`)
- `GET /accounts/cbus` - Obtener lista de CBUs (requiere permiso `accounts:read-cbus`)

### Permisos disponibles

El sistema define los siguientes permisos que pueden asignarse a las API Keys:

- `zendesk:create-ticket` - Permite crear tickets
- `zendesk:read-tickets` - Permite leer tickets
- `zendesk:update-ticket` - Permite actualizar tickets
- `accounts:read-cbus` - Permite leer información de CBUs

### Mejores prácticas de seguridad

1. **Rotación de claves**: Establezca fechas de expiración cortas (30-90 días) y rote las API Keys periódicamente.
2. **Monitoreo y auditoría**: El sistema registra todas las solicitudes realizadas con API Keys para facilitar la detección de uso inusual o sospechoso.
3. **Revocación inmediata**: Utilice el endpoint de desactivación para revocar inmediatamente las API Keys comprometidas:
   ```bash
   curl -X PUT https://api.ejemplo.com/api-keys/{key-id}/deactivate \
     -H "Authorization: Bearer {JWT_TOKEN}"
   ```
4. **Limitación de tasa**: El sistema implementa rate limiting para prevenir abusos (máximo 100 solicitudes por minuto por API Key).
5. **Permisos granulares**: Asigne únicamente los permisos mínimos necesarios para cada cliente o caso de uso.
6. **Transporte seguro**: Todas las API Keys deben transmitirse exclusivamente a través de conexiones HTTPS.
7. **Almacenamiento seguro**: Los clientes deben almacenar las API Keys de forma segura, preferiblemente en sistemas de gestión de secretos.
