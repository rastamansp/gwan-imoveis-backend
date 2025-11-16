# 🏠 Litoral Imóveis Backend

Backend da plataforma Litoral Imóveis - Corretora de locação e venda de imóveis, construído com NestJS e TypeScript, seguindo os princípios de **Clean Architecture** e **SOLID**.

## 🚀 Funcionalidades

- **Gestão de Imóveis**: Sistema completo para gerenciamento de imóveis (em desenvolvimento)
- **Autenticação**: JWT com Passport e roles (USER, ORGANIZER, ADMIN)
- **Chatbot Inteligente**: Agente conversacional via OpenAI integrado com MCP para atendimento sobre imóveis
- **MCP Server**: Model Context Protocol para integração com IA
- **Administração**: Dashboard administrativo
- **Logging Estruturado**: Sistema de logs no formato NestJS
- **Documentação Completa**: Swagger + Mermaid + Markdown
- **Migrações Automáticas**: TypeORM migrations para versionamento do banco
- **Integração WhatsApp**: Webhook para recebimento de mensagens

## 🛠️ Stack Tecnológica

### Core
- **NestJS** v10 - Framework Node.js para aplicações escaláveis
- **TypeScript** v5 - Tipagem estática e modernas features ES6+
- **TypeORM** v0.3 - ORM para PostgreSQL com migrations

### Banco de Dados
- **PostgreSQL** - Banco de dados relacional principal
- Migrations automáticas com TypeORM

### Autenticação e Segurança
- **JWT** com Passport para autenticação stateless
- **bcryptjs** para hash de senhas
- Roles: USER, ORGANIZER, ADMIN

### IA e Conversational Agents
- **OpenAI API** - GPT para chatbot inteligente
- **MCP (Model Context Protocol)** - Expor APIs como tools
- **axios** - Cliente HTTP para APIs externas

### Documentação e Validação
- **Swagger/OpenAPI** - Documentação interativa da API
- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de objetos

### Utilitários
- **uuid** - Geração de identificadores únicos

### Testes e Qualidade
- **Jest** - Framework de testes
- **ESLint** - Linting de código
- **Prettier** - Formatação automática

## 📋 Pré-requisitos

- **Node.js** v20+
- **PostgreSQL** v14+
- **npm** ou **yarn**
- **Git**

## 🚀 Início Rápido

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/litoral-imoveis-backend.git
cd litoral-imoveis-backend
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=litoral_imoveis

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# OpenAI (para chatbot)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# MCP (opcional)
MCP_BASE_URL=http://localhost:3001
MCP_AUTH_TOKEN=your-mcp-token
```

### 4. Execute as Migrações

```bash
npm run typeorm:migration:run
```

### 5. Crie um Usuário Admin

```bash
npm run admin:create
```

### 6. Inicie o Servidor

```bash
# Desenvolvimento com hot reload
npm run start:dev

# Produção
npm run start:prod
```

### 7. Acesse a Documentação

- **Swagger UI**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 📁 Estrutura do Projeto

```
src/
├── main.ts                           # Ponto de entrada
├── app.module.ts                     # Módulo principal
├── shared/                           # Código compartilhado
│   ├── domain/                       # Entidades e regras de negócio
│   │   ├── entities/                 # User, Conversation, Message, Agent
│   │   ├── value-objects/           # Enums e value objects
│   │   ├── exceptions/              # Custom exceptions
│   │   └── interfaces/              # Repository interfaces
│   ├── infrastructure/              # Implementações externas
│   │   └── repositories/            # TypeORM repositories
│   ├── application/                 # Casos de uso
│   │   ├── use-cases/               # Use cases da aplicação
│   │   └── interfaces/              # Service interfaces
│   └── presentation/                # Controllers e DTOs
│       ├── dtos/                    # Data Transfer Objects
│       └── filters/                 # Exception filters
├── modules/                          # Módulos da aplicação
│   ├── auth/                        # Autenticação e autorização
│   ├── users/                       # Gestão de usuários
│   ├── admin/                       # Painel administrativo
│   ├── chat/                        # Chatbot inteligente
│   ├── whatsapp-webhook/            # Webhook do WhatsApp
│   ├── mcp/                         # Servidor MCP
│   └── health/                      # Health check
├── config/                           # Configurações
│   ├── typeorm.config.ts            # Config TypeORM
│   └── data-source.ts               # Data Source migrations
├── database/                         # Database utilities
└── migrations/                       # TypeORM migrations
```

## 🏗️ Arquitetura

### Clean Architecture

O projeto segue **Clean Architecture** com 3 camadas principais:

```
┌─────────────────────────────────────────┐
│  Presentation Layer (Controllers, DTOs) │
├─────────────────────────────────────────┤
│  Application Layer (Use Cases, Services) │
├─────────────────────────────────────────┤
│  Domain Layer (Entities, Interfaces)    │
├─────────────────────────────────────────┤
│  Infrastructure Layer (Repositories, DB) │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

```mermaid
graph TB
    Client[Cliente Frontend]
    Controller[Controller NestJS]
    UseCase[Use Case]
    Repository[Repository Interface]
    Entity[Entity/Domain Logic]
    DB[(PostgreSQL)]
    
    Client --> Controller
    Controller --> UseCase
    UseCase --> Repository
    Repository --> Entity
    Entity --> DB
    
    style Client fill:#e1f5e1
    style Controller fill:#fff4e1
    style UseCase fill:#ffe1f5
    style Repository fill:#e1f5ff
    style Entity fill:#f5e1ff
    style DB fill:#ffe1e1
```

### Módulos e Dependências

```mermaid
graph LR
    App[AppModule]
    
    Auth[AuthModule]
    Users[UsersModule]
    Admin[AdminModule]
    MCP[McpModule]
    Chat[ChatModule]
    WhatsApp[WhatsappWebhookModule]
    Shared[SharedModule]
    
    App --> Auth
    App --> Users
    App --> Admin
    App --> MCP
    App --> Chat
    App --> WhatsApp
    App --> Shared
    
    Users -.-> Shared
    Auth -.-> Shared
    Chat -.-> Shared
    
    style App fill:#f5e1ff
    style Shared fill:#fff4e1
```

## 🔌 APIs Expostas

### Arquivos .http para Testes

Cada módulo possui um arquivo `.http` para facilitar testes via REST Client:

#### 1. Autenticação (`src/auth/auth.http`)
**Endpoints disponíveis:**
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/register` - Registrar usuário
- `GET /api/auth/profile` - Obter perfil (auth)

**Uso:**
```http
### Login
POST http://localhost:3001/api/auth/login
{
  "email": "admin@litoralimoveis.com.br",
  "password": "password"
}
```

#### 2. Usuários (`src/users/users.http`)
**Endpoints disponíveis:**
- `GET /api/users` - Listar usuários (auth)
- `GET /api/users/:id` - Obter usuário por ID (auth)
- `PUT /api/users/:id` - Atualizar usuário (auth)
- `DELETE /api/users/:id` - Deletar usuário (auth)

#### 3. Admin (`src/admin/admin.http`)
**Endpoints disponíveis:**
- `GET /api/admin/dashboard` - Dashboard geral (auth)

#### 4. Chat (`src/chat/chat.http`)
**Endpoints disponíveis:**
- `POST /api/chat` - Chatbot inteligente

**Uso:**
```http
### Chat - Consulta sobre imóveis
POST http://localhost:3001/api/chat
{
  "message": "Quais imóveis estão disponíveis para locação em Florianópolis?",
  "userCtx": {
    "city": "Florianópolis",
    "language": "pt-BR"
  },
  "channel": "web"
}
```

#### 5. Health (`src/health/health.http`)
**Endpoints disponíveis:**
- `GET /api/health` - Health check

#### 6. MCP Tools (`src/mcp/`)
**APIs MCP expostas:**
- Ferramentas para consulta de imóveis (em desenvolvimento)

**Uso:**
```bash
# Via stdio
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run start:mcp:stdio

# Via HTTP bridge
GET http://localhost:3001/api/mcp/tools
POST http://localhost:3001/api/mcp/tools/call
{
  "name": "search_properties",
  "arguments": {
    "city": "Florianópolis",
    "type": "rent"
  }
}
```

## 🤖 Chatbot Inteligente

### Funcionalidades

O chatbot utiliza **OpenAI GPT** com integração **MCP** para:
- Consultas sobre imóveis disponíveis
- Informações sobre locação e venda
- Sugestões baseadas em contexto do usuário
- Integração WhatsApp com mensagens formatadas

### Documentação Completa

Para entender em detalhes o fluxo completo do chatbot, consulte:
- 📖 [Fluxo de Chamadas do Chatbot](./docs/chatbot/chatbot-flow.md) - Documentação completa
- 📊 [Diagramas do Chatbot](./docs/diagrams/chatbot-flow.md) - Diagramas Mermaid detalhados

## 📝 Scripts Disponíveis

### Desenvolvimento
- `npm run start:dev` - Desenvolvimento com hot reload
- `npm run start:debug` - Desenvolvimento com debug
- `npm run start:prod` - Produção
- `npm run build` - Compilar TypeScript

### MCP Server
- `npm run start:mcp:stdio` - MCP Server stdio
- `npm run start:mcp:sse` - MCP Server SSE
- `npm run build:mcp` - Compilar MCP

### Qualidade de Código
- `npm run lint` - ESLint
- `npm run format` - Prettier

### Database
- `npm run typeorm:migration:run` - Executar migrações
- `npm run typeorm:migration:revert` - Reverter última migração
- `npm run typeorm:migration:generate` - Gerar nova migração
- `npm run admin:create` - Criar usuário admin

### Documentação Automática
- `npm run docs:generate` - Gerar toda a documentação
- `npm run docs:validate` - Validar documentação
- `npm run docs:serve` - Servir documentação localmente
- `npm run docs:watch` - Monitorar mudanças e regenerar
- `npm run docs:clean` - Limpar arquivos gerados
- `npm run docs:help` - Mostrar ajuda

### Deploy
- `npm run deploy:prepare` - Preparar para deploy (build + docs)
- `npm run deploy:prod` - Deploy para produção
- `npm run deploy:rollback` - Rollback

### Docker
- `npm run docker:build` - Build das imagens
- `npm run docker:up` - Subir containers
- `npm run docker:down` - Parar containers
- `npm run docker:logs` - Ver logs
- `npm run docker:restart` - Reiniciar containers

## 🚢 Deploy

### Deploy Local com Docker

```bash
# 1. Configurar variáveis de ambiente
cp env.example .env

# 2. Subir containers
docker-compose up -d

# 3. Executar migrações
docker exec -it litoral-imoveis-backend npm run typeorm:migration:run

# 4. Criar admin
docker exec -it litoral-imoveis-backend npm run admin:create
```

### Deploy com Portainer

```bash
# Via script (Windows)
npm run portainer:deploy:prod:win

# Via script (Linux/Mac)
npm run portainer:deploy:prod
```

Ver documentação completa em `docs/deployment/`.

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov

# Testes com watch
npm run test:watch
```

## 📚 Documentação

### Documentação Completa
- [Arquitetura](./docs/architecture/overview.md)
- [Desenvolvimento](./docs/development/setup.md)
- [APIs](./docs/api/overview.md)
- [MCP](./docs/mcp/overview.md)
- [Deploy](./docs/deployment/deploy-automation.md)
- [Diagramas](./docs/diagrams/system-architecture.md)

### Gerar Documentação

```bash
# Gerar toda documentação
npm run docs:generate

# Validar documentação
npm run docs:validate
```

## 🛡️ Segurança

- **JWT Authentication** com Passport
- **Rate Limiting** para prevenir abuso
- **CORS** configurado para domínios específicos
- **Validação** de entrada com class-validator
- **Autenticação MCP** via token
- **bcryptjs** para hash de senhas

## 🐛 Solução de Problemas

### Erro: "EADDRINUSE: address already in use :::3001"

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill
```

### Erro de Dependências

```bash
npm cache clean --force
npm install
```

### Erro de Build

```bash
npm run build
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões
- Siga os [padrões de código](./.cursorrules)
- Escreva testes para novas funcionalidades
- Atualize a documentação
- Use commits semânticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [docs/README.md](./docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/litoral-imoveis-backend/issues)

## 🎯 Roadmap

- [ ] Implementar módulo de imóveis completo
- [ ] Adicionar endpoints MCP para consulta de imóveis
- [ ] Implementar cache distribuído
- [ ] Adicionar suporte a WebSockets
- [ ] Implementar sistema de notificações
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Integração com sistemas de pagamento
- [ ] Sistema de agendamento de visitas

---

**🏠 Backend da plataforma Litoral Imóveis!**
