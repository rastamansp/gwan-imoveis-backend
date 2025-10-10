import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import { DomainExceptionFilter } from '../shared/presentation/filters/domain-exception.filter';
import { HttpExceptionFilter } from '../shared/presentation/filters/http-exception.filter';
import { LoggingMiddleware } from '../shared/infrastructure/middleware/logging.middleware';

export async function bootstrapMcp() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Menos logs para MCP
  });

  // Configuração de prefixo global
  app.setGlobalPrefix('api');

  // Middleware de logging de requests
  const loggingMiddleware = new LoggingMiddleware();
  app.use(loggingMiddleware.use);

  // Configuração de validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuração de Exception Filters globais
  app.useGlobalFilters(
    new DomainExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Gwan Shop API')
    .setDescription('API da plataforma de eventos e venda de ingressos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);

  // NÃO iniciar o servidor HTTP, apenas retornar o documento
  return { app, document };
}
