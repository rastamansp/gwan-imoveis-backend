import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { LoggingMiddleware } from './shared/infrastructure/middleware/logging.middleware';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Configuração de CORS
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://events.gwan.com.br',
        'https://www.events.gwan.com.br',
        'http://events.gwan.com.br',
        'http://www.events.gwan.com.br',
        'https://api-events.gwan.com.br',
        'https://www.api-events.gwan.com.br',
        'http://api-events.gwan.com.br',
        'http://www.api-events.gwan.com.br'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        'file://',
        'null'
      ];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Log das configurações de CORS para debug
  console.log('🔧 Configuração de CORS:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('CORS Origins permitidos:', corsOrigins);

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

  // Rota raiz para redirecionar para a documentação
  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/api');
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Gwan Shop API')
    .setDescription('API da plataforma de eventos e venda de ingressos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api`);

  return { app, document };
}

bootstrap();
