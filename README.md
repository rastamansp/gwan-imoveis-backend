# 🎉 Gwan Events Backend

Backend da plataforma de eventos e venda de ingressos construído com NestJS e TypeScript, seguindo os princípios de Clean Architecture e SOLID.

## 🚀 Funcionalidades

- **Gestão de Eventos**: Criar, listar, atualizar e deletar eventos
- **Sistema de Ingressos**: Comprar, validar e transferir ingressos
- **Pagamentos**: Integração com Stripe e Mercado Pago
- **Autenticação**: JWT com Passport
- **Administração**: Dashboard administrativo com analytics
- **MCP Server**: Model Context Protocol para integração com IA
- **Logging Estruturado**: Sistema de logs no formato NestJS
- **Documentação Completa**: Swagger + Mermaid + Markdown

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **TypeORM** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Swagger** - Documentação da API
- **MCP** - Model Context Protocol
- **Mermaid** - Diagramas de arquitetura

## 📋 Pré-requisitos

- Node.js v20+
- PostgreSQL v14+
- Redis v6+

## 🚀 Início Rápido

### Desenvolvimento Local

1. **Clone o repositório**:
```bash
git clone https://github.com/seu-usuario/gwan-events-backend.git
cd gwan-events-backend
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### Deploy com Docker

1. **Configure as variáveis de ambiente**:
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações de produção
```

2. **Crie a rede Docker**:
```bash
docker network create gwan
```

3. **Deploy para produção**:
```bash
# Via script automatizado
npm run portainer:deploy:prod

# Ou manualmente
docker-compose -f docker-compose.prod.yml up -d --build
```

### Deploy com Portainer

1. **Configure o Portainer** com o arquivo `docker-compose.prod.yml`
2. **Configure as variáveis de ambiente** no Portainer
3. **Deploy automático** via GitHub Actions

4. **Execute as migrações**:
```bash
npm run migration:run
```

5. **Inicie o servidor**:
```bash
npm run start:dev
```

6. **Acesse a documentação**:
- **API**: http://localhost:3001/api (Swagger UI)
- **Documentação**: [docs/README.md](./docs/README.md)

## 📚 Documentação Completa

### 🏗️ Arquitetura
- [Visão Geral da Arquitetura](./docs/architecture/overview.md)

### 🔧 Desenvolvimento
- [Guia de Configuração](./docs/development/setup.md)
- [Documentação Automática](./docs/development/auto-documentation.md)

### 🚀 APIs
- [Documentação da API](./docs/api/overview.md)

### 🔌 MCP (Model Context Protocol)
- [Visão Geral do MCP](./docs/mcp/overview.md)

### 🚀 Deploy e Produção
- [Deploy Automático](./docs/deployment/deploy-automation.md)
- [Deploy com Docker](./docs/deployment/docker.md)
- [Deploy com Portainer](./docs/deployment/portainer.md)
- [Configuração de Ambiente](./docs/deployment/environment.md)

### 📊 Diagramas
- [Arquitetura do Sistema](./docs/diagrams/system-architecture.md)

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

### Documentação Automática
- `npm run docs:generate` - Gerar toda a documentação
- `npm run docs:validate` - Validar documentação
- `npm run docs:serve` - Servir documentação localmente
- `npm run docs:watch` - Monitorar mudanças e regenerar
- `npm run docs:clean` - Limpar arquivos gerados
- `npm run docs:help` - Mostrar ajuda

### Deploy e Produção
- `npm run deploy:prepare` - Preparar para deploy (build + docs)
- `npm run deploy:prod` - Deploy para produção
- `npm run deploy:rollback` - Rollback em caso de problemas

### Docker e Portainer
- `npm run docker:build` - Build das imagens Docker
- `npm run docker:up` - Subir containers
- `npm run docker:down` - Parar containers
- `npm run docker:logs` - Ver logs dos containers
- `npm run docker:restart` - Reiniciar containers
- `npm run docker:prod` - Deploy para produção com Docker
- `npm run docker:dev` - Deploy para desenvolvimento com Docker
- `npm run docker:clean` - Limpar containers e volumes
- `npm run portainer:deploy` - Deploy via Portainer (Linux/Mac)
- `npm run portainer:deploy:prod` - Deploy para produção via Portainer (Linux/Mac)
- `npm run portainer:deploy:dev` - Deploy para desenvolvimento via Portainer (Linux/Mac)
- `npm run portainer:status` - Status dos containers via Portainer (Linux/Mac)
- `npm run portainer:logs` - Logs dos containers via Portainer (Linux/Mac)
- `npm run portainer:rollback` - Rollback via Portainer (Linux/Mac)
- `npm run portainer:deploy:win` - Deploy via Portainer (Windows)
- `npm run portainer:deploy:prod:win` - Deploy para produção via Portainer (Windows)
- `npm run portainer:deploy:dev:win` - Deploy para desenvolvimento via Portainer (Windows)
- `npm run portainer:status:win` - Status dos containers via Portainer (Windows)
- `npm run portainer:logs:win` - Logs dos containers via Portainer (Windows)
- `npm run portainer:rollback:win` - Rollback via Portainer (Windows)

## 🔌 MCP Server

O projeto inclui um servidor MCP (Model Context Protocol) que expõe as APIs como tools para clientes MCP como Claude Desktop.

### Tools Disponíveis
- `list_events` - Lista todos os eventos
- `get_event_by_id` - Obter evento por ID
- `get_event_ticket_categories` - Listar categorias de ingressos

### Uso Rápido
```bash
# Testar MCP Server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run start:mcp:stdio

# Executar tool
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "list_events", "arguments": {}}}' | npm run start:mcp:stdio
```

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** com as seguintes camadas:

```
src/
├── shared/                   # Código compartilhado
│   ├── domain/              # Entidades e regras de negócio
│   ├── infrastructure/      # Implementações externas
│   ├── application/         # Casos de uso
│   └── presentation/        # Controllers e DTOs
├── modules/                 # Módulos da aplicação
│   ├── auth/               # Autenticação
│   ├── users/              # Usuários
│   ├── events/             # Eventos
│   ├── tickets/            # Ingressos
│   ├── payments/           # Pagamentos
│   └── admin/              # Administração
└── mcp/                    # Servidor MCP
```

## 🛠️ Comandos Úteis para Desenvolvimento

### Verificar se o servidor está rodando
```bash
curl http://localhost:3001
```

### Verificar processos usando a porta 3001
```bash
netstat -ano | findstr :3001
```

### Parar todos os processos Node.js
```bash
taskkill /IM node.exe /F
```

### Limpar cache do npm (se houver problemas)
```bash
npm cache clean --force
```

## 🌐 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/register` - Registrar usuário
- `GET /api/auth/profile` - Perfil do usuário

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Detalhes do evento
- `POST /api/events` - Criar evento (autenticado)
- `GET /api/events/:id/ticket-categories` - Categorias de ingressos

### Ingressos
- `GET /api/tickets` - Listar ingressos
- `POST /api/tickets` - Criar ingresso
- `POST /api/tickets/:id/validate` - Validar ingresso
- `PUT /api/tickets/:id/use` - Marcar como usado

### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar pagamento
- `PUT /api/payments/:id/approve` - Aprovar pagamento

### Admin
- `GET /api/admin/dashboard` - Estatísticas gerais
- `GET /api/admin/events/:id/analytics` - Analytics do evento

## 📚 Documentação da API

A documentação interativa está disponível em:
- **Swagger UI**: http://localhost:3001/api

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## 🐳 Docker

### Build da imagem
```bash
docker build -t gwan-events-backend .
```

### Executar container
```bash
docker run -p 3001:3001 gwan-events-backend
```

## 🏗️ Estrutura do Projeto

```
src/
├── admin/           # Módulo administrativo
├── auth/            # Autenticação e autorização
├── events/          # Gestão de eventos
├── payments/        # Sistema de pagamentos
├── tickets/         # Gestão de ingressos
├── users/           # Gestão de usuários
├── app.module.ts    # Módulo principal
└── main.ts          # Arquivo de entrada
```

## 🔗 Links Relacionados

- **Frontend**: [gwan-events](https://github.com/rastamansp/gwan-events)
- **Documentação de Deploy**: Ver repositório principal

## 🐛 Solução de Problemas

### Erro: "EADDRINUSE: address already in use :::3001"

Este erro indica que a porta 3001 já está sendo usada por outro processo. Siga estes passos para resolver:

#### Opção 1: Parar o processo que está usando a porta (Recomendado)

1. **Identificar o processo:**
   ```bash
   netstat -ano | findstr :3001
   ```

2. **Parar o processo (substitua XXXX pelo PID encontrado):**
   ```bash
   taskkill /PID XXXX /F
   ```

3. **Reiniciar o servidor:**
   ```bash
   npm run start:dev
   ```

#### Opção 2: Usar uma porta diferente

1. **Editar o arquivo `.env`:**
   ```env
   PORT=3002
   ```

2. **Reiniciar o servidor:**
   ```bash
   npm run start:dev
   ```

#### Opção 3: Parar todos os processos Node.js

```bash
taskkill /IM node.exe /F
```

### Erro de dependências
Execute `npm install` para instalar todas as dependências

### Erro de build
Execute `npm run build` para verificar se há erros de compilação

### Dicas de Prevenção
- Sempre use `Ctrl+C` para parar o servidor antes de reiniciar
- Verifique se não há outros processos Node.js rodando em background
- Use `npm run start:dev` apenas uma vez por terminal

## 🔒 Segurança

- **JWT Authentication** com Passport
- **Rate Limiting** para prevenir abuso
- **CORS** configurado para domínios específicos
- **Helmet** para headers de segurança
- **Validação** de entrada com class-validator
- **Autenticação MCP** via token

## 📊 Monitoramento

- **Logs estruturados** no formato NestJS
- **Métricas** com Prometheus
- **Dashboards** com Grafana
- **Health checks** para monitoramento

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Contribuição
- Siga os [padrões de código](./docs/development/coding-standards.md)
- Escreva testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use commits semânticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [docs/README.md](./docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/gwan-events-backend/issues)

## 🎯 Roadmap

- [ ] Implementar testes e2e completos
- [ ] Adicionar mais endpoints MCP
- [ ] Implementar cache distribuído
- [ ] Adicionar suporte a WebSockets
- [ ] Implementar sistema de notificações
- [ ] Adicionar suporte a múltiplos idiomas

---

**🎉 Backend da plataforma Gwan Events!**
