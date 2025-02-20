import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: [
      'https://backoffice-casino-front-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:8000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true
  });

  const config = new DocumentBuilder()
    .setTitle('Casino Backoffice API')
    .setDescription('API documentation for Casino Backoffice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();