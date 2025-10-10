# 🚀 Guia de Configuração

## Pré-requisitos

### Software Necessário

- **Node.js** v20+ ([Download](https://nodejs.org/))
- **npm** v10+ (incluído com Node.js)
- **PostgreSQL** v14+ ([Download](https://www.postgresql.org/download/))
- **Redis** v6+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Ferramentas Recomendadas

- **VS Code** com extensões:
  - TypeScript Importer
  - Prettier
  - ESLint
  - REST Client
- **Postman** ou **Insomnia** para testes de API
- **Docker** e **Docker Compose** (opcional)

## Configuração do Ambiente

### 1. Clone do Repositório

```bash
git clone https://github.com/seu-usuario/gwan-events-backend.git
cd gwan-events-backend
```

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Configuração do Banco de Dados

#### PostgreSQL

```bash
# Criar banco de dados
createdb gwan_events

# Ou via psql
psql -U postgres
CREATE DATABASE gwan_events;
\q
```

#### Redis

```bash
# Iniciar Redis (Linux/Mac)
redis-server

# Ou via Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Configuração de Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env`:

```env
# Configurações do Backend
PORT=3001
NODE_ENV=development

# JWT Secret (em produção, use uma chave segura)
JWT_SECRET=pazdeDeus

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/gwan_events

# Redis
REDIS_URL=redis://localhost:6379

# Email (opcional para desenvolvimento)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Payment Gateway (opcional para desenvolvimento)
STRIPE_SECRET_KEY=sk_test_...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_...

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# MCP Server Configuration
MCP_BASE_URL=http://localhost:3001
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=
```

### 5. Execução do Projeto

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# MCP Server
npm run start:mcp:stdio
npm run start:mcp:sse
```

## Estrutura do Projeto

```
gwan-events-backend/
├── src/                          # Código fonte
│   ├── main.ts                   # Ponto de entrada
│   ├── app.module.ts             # Módulo principal
│   ├── shared/                   # Código compartilhado
│   │   ├── domain/               # Entidades e regras de negócio
│   │   ├── infrastructure/        # Implementações externas
│   │   ├── application/          # Casos de uso
│   │   └── presentation/         # Controllers e DTOs
│   ├── modules/                  # Módulos da aplicação
│   │   ├── auth/                 # Autenticação
│   │   ├── users/                # Usuários
│   │   ├── events/               # Eventos
│   │   ├── tickets/              # Ingressos
│   │   ├── payments/             # Pagamentos
│   │   └── admin/                # Administração
│   └── mcp/                      # Servidor MCP
├── docs/                         # Documentação
├── test/                         # Testes
├── uploads/                      # Arquivos enviados
├── .env                          # Variáveis de ambiente
├── .env.example                  # Exemplo de variáveis
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── nest-cli.json                 # Configuração NestJS
└── README.md                     # Documentação principal
```

## Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
npm run start:dev

# Iniciar em modo debug
npm run start:debug

# Compilar TypeScript
npm run build

# Executar testes
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### MCP Server

```bash
# Servidor MCP stdio
npm run start:mcp:stdio

# Servidor MCP SSE
npm run start:mcp:sse

# Compilar MCP
npm run build:mcp
```

### Qualidade de Código

```bash
# Linting
npm run lint

# Formatação
npm run format
```

## Configuração do VS Code

### Extensões Recomendadas

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "humao.rest-client",
    "bradlc.vscode-tailwindcss"
  ]
}
```

### Configurações do Workspace

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

## Configuração do Docker (Opcional)

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: gwan_events
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/gwan_events
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

## Testes

### Configuração de Testes

```bash
# Instalar dependências de teste
npm install --save-dev @nestjs/testing jest supertest

# Executar testes unitários
npm run test

# Executar testes com watch
npm run test:watch

# Executar testes com coverage
npm run test:cov

# Executar testes e2e
npm run test:e2e
```

### Exemplo de Teste

```typescript
// src/events/events.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Troubleshooting

### Problemas Comuns

#### Erro: "Cannot find module"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Erro: "Port already in use"
```bash
# Encontrar processo usando a porta
lsof -i :3001

# Encerrar processo
kill -9 <PID>
```

#### Erro: "Database connection failed"
- Verifique se PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `psql -U postgres -d gwan_events`

#### Erro: "Redis connection failed"
- Verifique se Redis está rodando
- Confirme a URL no `.env`
- Teste a conexão: `redis-cli ping`

### Logs de Debug

```bash
# Executar com logs detalhados
DEBUG=* npm run start:dev

# Logs específicos do NestJS
DEBUG=nest:* npm run start:dev
```

## Próximos Passos

1. [Documentação Automática](./auto-documentation.md) - Sistema de documentação automática
2. [APIs](../api/overview.md) - Documentação das APIs
3. [Deploy](../deployment/deploy-automation.md) - Deploy automático
