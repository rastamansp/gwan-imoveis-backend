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
  const corsOriginsEnv = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : null;

  const corsOrigins = process.env.NODE_ENV === 'production'
    ? (corsOriginsEnv && corsOriginsEnv.length > 0
        ? corsOriginsEnv
        : [
            'https://events.gwan.com.br',
            'https://www.events.gwan.com.br',
            'http://events.gwan.com.br',
            'http://www.events.gwan.com.br',
            'https://api-events.gwan.com.br',
            'https://www.api-events.gwan.com.br',
            'http://api-events.gwan.com.br',
            'http://www.api-events.gwan.com.br',
            // Domínios principais do site (incluindo bot Jaiminho)
            'https://gwan.com.br',
            'https://www.gwan.com.br',
            'http://gwan.com.br',
            'http://www.gwan.com.br',
          ])
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        'file://',
        'null',
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
  // const loggingMiddleware = new LoggingMiddleware();
  // app.use(loggingMiddleware.use);

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
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Digite o token JWT (sem o prefixo "Bearer ")',
        in: 'header',
      },
      'bearer', // Nome do esquema de segurança
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Token permanente para testes no Swagger (usuário ADMIN)
  // Gerado via: npm run generate:swagger-token
  const SWAGGER_TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGd3YW4uY29tLmJyIiwic3ViIjoiYjAzZThlOWYtMmU1MC00YTY2LWIxN2YtN2JjNzdmYmI0ZmM2Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzYyMjc2Njk5LCJleHAiOjMxNzMwNjcxOTA5OX0.CpxSFzZvx796Avz8daw3tPld5ifmLJ7aebQqMyQJmRo';
  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Salvar token entre sessões
    },
    customSiteTitle: 'Gwan Shop API - Documentação',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .auth-wrapper { margin: 10px 0; }
    `,
    customJs: `
      (function() {
        const token = '${SWAGGER_TEST_TOKEN}';
        let attempts = 0;
        const maxAttempts = 50; // Tentar por até 5 segundos
        
        function preauthorizeToken() {
          attempts++;
          
          try {
            // Método 1: Usar preauthorizeApiKey (método oficial do Swagger UI)
            if (typeof window.ui !== 'undefined' && window.ui.preauthorizeApiKey) {
              window.ui.preauthorizeApiKey('bearer', token);
              console.log('✅ Token pré-autorizado via preauthorizeApiKey');
              
              // Verificar se o token foi realmente aplicado
              setTimeout(function() {
                const authBtn = document.querySelector('button.authorize');
                if (authBtn && authBtn.classList.contains('locked')) {
                  console.log('✅ Token aplicado com sucesso - botão Authorize está bloqueado');
                } else {
                  console.log('⚠️ Token pode não ter sido aplicado corretamente');
                }
              }, 1000);
              return;
            }
            
            // Método 2: Se preauthorizeApiKey não funcionou, tentar preencher o modal manualmente
            if (attempts < maxAttempts) {
              setTimeout(preauthorizeToken, 100);
            } else {
              // Última tentativa: abrir o modal e preencher
              const authorizeButton = document.querySelector('button.authorize');
              if (authorizeButton) {
                authorizeButton.click();
                setTimeout(function() {
                  const modalInput = document.querySelector('.auth-container input[type="text"], .auth-container input[type="password"]');
                  if (modalInput) {
                    modalInput.value = token;
                    modalInput.dispatchEvent(new Event('input', { bubbles: true }));
                    modalInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Clicar no botão de autorizar
                    setTimeout(function() {
                      const authorizeBtn = document.querySelector('.auth-container button.btn-done, .auth-container button[type="button"]');
                      if (authorizeBtn) {
                        authorizeBtn.click();
                        console.log('✅ Token preenchido e autorizado via modal');
                      }
                    }, 200);
                  }
                }, 300);
              }
            }
          } catch (e) {
            console.log('Erro ao pré-preencher token (tentativa ' + attempts + '):', e);
            if (attempts < maxAttempts) {
              setTimeout(preauthorizeToken, 100);
            }
          }
        }
        
        // Aguardar carregamento completo da página
        if (document.readyState === 'complete') {
          setTimeout(preauthorizeToken, 1000);
        } else {
          window.addEventListener('load', function() {
            setTimeout(preauthorizeToken, 1000);
          });
        }
        
        // Também tentar quando o Swagger UI estiver pronto
        window.addEventListener('DOMContentLoaded', function() {
          setTimeout(preauthorizeToken, 1500);
        });
      })();
    `,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api`);

  return { app, document };
}

bootstrap();
