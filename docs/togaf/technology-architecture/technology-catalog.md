# Technology Catalog - Catálogo de Tecnologias

## Visão Geral

Este documento cataloga todas as **tecnologias** utilizadas na plataforma Litoral Imóveis, descrevendo suas versões, propósitos e relacionamentos.

## Stack Tecnológica Principal

### 1. Runtime e Linguagem

**Node.js**
- **Versão**: 20.x (Alpine)
- **Tipo**: Runtime JavaScript
- **Uso**: Execução da aplicação backend
- **Justificativa**: Performance, ecossistema rico, suporte a TypeScript

**TypeScript**
- **Versão**: 5.x
- **Tipo**: Linguagem de programação
- **Uso**: Desenvolvimento com tipagem estática
- **Justificativa**: Type safety, melhor DX, suporte a recursos modernos

### 2. Framework e Core

**NestJS**
- **Versão**: 10.x
- **Tipo**: Framework Node.js
- **Uso**: Estrutura da aplicação, DI, módulos
- **Módulos Principais**:
  - @nestjs/common
  - @nestjs/core
  - @nestjs/config
  - @nestjs/typeorm
  - @nestjs/jwt
  - @nestjs/passport
  - @nestjs/swagger
  - @nestjs/cache-manager
- **Justificativa**: Arquitetura escalável, padrões enterprise, TypeScript nativo

**Express**
- **Versão**: (via @nestjs/platform-express)
- **Tipo**: Web framework
- **Uso**: HTTP server subjacente ao NestJS
- **Justificativa**: Padrão do NestJS, performance, middleware ecosystem

### 3. Banco de Dados

**PostgreSQL**
- **Versão**: 14+
- **Tipo**: Banco de dados relacional
- **Uso**: Armazenamento principal de dados
- **Características**:
  - ACID compliance
  - JSONB para dados flexíveis
  - Full-text search (futuro)
- **Justificativa**: Confiabilidade, performance, recursos avançados

**TypeORM**
- **Versão**: 0.3.x
- **Tipo**: ORM (Object-Relational Mapping)
- **Uso**: Abstração de acesso a dados
- **Características**:
  - Migrations
  - Entity decorators
  - Query builder
  - Relations
- **Justificativa**: TypeScript nativo, migrations, type safety

**pg (PostgreSQL Driver)**
- **Versão**: 8.x
- **Tipo**: Driver nativo
- **Uso**: Conexão com PostgreSQL
- **Justificativa**: Performance, confiabilidade

### 4. Cache

**Redis**
- **Versão**: 7.x
- **Tipo**: In-memory data store
- **Uso**: Cache de dados frequentes
- **Justificativa**: Alta performance, TTL automático, estruturas de dados ricas

**cache-manager**
- **Versão**: 7.x
- **Tipo**: Cache abstraction
- **Uso**: Interface unificada para cache
- **Justificativa**: Abstração, múltiplos backends

**cache-manager-redis-store**
- **Versão**: 3.x
- **Tipo**: Redis adapter
- **Uso**: Integração Redis com cache-manager
- **Justificativa**: Compatibilidade com NestJS cache

### 5. Autenticação e Segurança

**JWT (JSON Web Tokens)**
- **Versão**: (via @nestjs/jwt)
- **Tipo**: Token de autenticação
- **Uso**: Autenticação stateless
- **Justificativa**: Escalável, stateless, padrão da indústria

**Passport**
- **Versão**: 0.7.x
- **Tipo**: Authentication middleware
- **Uso**: Estratégias de autenticação
- **Estratégias**:
  - passport-jwt (JWT)
  - passport-local (Local)
- **Justificativa**: Flexibilidade, múltiplas estratégias

**bcryptjs**
- **Versão**: 2.4.x
- **Tipo**: Hash de senhas
- **Uso**: Hash de senhas de usuários
- **Justificativa**: Segurança, salt automático

### 6. Validação e Transformação

**class-validator**
- **Versão**: 0.14.x
- **Tipo**: Validação de classes
- **Uso**: Validação de DTOs
- **Justificativa**: Decorators, integração com NestJS

**class-transformer**
- **Versão**: 0.5.x
- **Tipo**: Transformação de objetos
- **Uso**: Transformação de DTOs
- **Justificativa**: Conversão de tipos, serialização

### 7. Armazenamento de Arquivos

**MinIO**
- **Versão**: Latest
- **Tipo**: Object storage (S3-compatible)
- **Uso**: Armazenamento de imagens de imóveis
- **Justificativa**: S3-compatible, self-hosted, escalável

**minio (Client)**
- **Versão**: 8.x
- **Tipo**: MinIO client library
- **Uso**: Integração com MinIO
- **Justificativa**: API simples, S3-compatible

**Sharp**
- **Versão**: 0.34.x
- **Tipo**: Image processing
- **Uso**: Processamento de imagens (resize, thumbnails)
- **Justificativa**: Performance, qualidade, Node.js nativo

**Multer**
- **Versão**: 2.x
- **Tipo**: File upload middleware
- **Uso**: Upload de arquivos
- **Justificativa**: Padrão Express, integração NestJS

### 8. Integração com IA

**OpenAI API**
- **Versão**: Latest
- **Tipo**: API externa
- **Uso**: Processamento de linguagem natural (GPT)
- **Justificativa**: SOTA em NLP, function calling

**axios**
- **Versão**: 1.12.x
- **Tipo**: HTTP client
- **Uso**: Requisições HTTP para APIs externas
- **Justificativa**: Promise-based, interceptors, amplamente usado

### 9. Integração WhatsApp

**Evolution API**
- **Versão**: Latest
- **Tipo**: API externa
- **Uso**: Integração com WhatsApp
- **Justificativa**: API moderna, webhooks, SDK oficial

**@solufy/evolution-sdk**
- **Versão**: 0.2.x
- **Tipo**: SDK Evolution API
- **Uso**: Cliente Evolution API
- **Justificativa**: SDK oficial, TypeScript support

### 10. Model Context Protocol

**@modelcontextprotocol/sdk**
- **Versão**: 1.20.x
- **Tipo**: MCP SDK
- **Uso**: Implementação do MCP Server
- **Justificativa**: Protocolo padrão, integração com IA

### 11. Documentação

**Swagger/OpenAPI**
- **Versão**: (via @nestjs/swagger 7.x)
- **Tipo**: API documentation
- **Uso**: Documentação interativa da API
- **Justificativa**: Padrão da indústria, geração automática

### 12. Utilitários

**uuid**
- **Versão**: 9.x
- **Tipo**: UUID generator
- **Uso**: Geração de identificadores únicos
- **Justificativa**: Padrão UUID, confiável

**qrcode**
- **Versão**: 1.5.x
- **Tipo**: QR Code generator
- **Uso**: Geração de QR codes (futuro)
- **Justificativa**: Biblioteca simples

**rxjs**
- **Versão**: 7.8.x
- **Tipo**: Reactive programming
- **Uso**: Programação reativa (NestJS)
- **Justificativa**: Core do NestJS

**reflect-metadata**
- **Versão**: 0.1.x
- **Tipo**: Metadata reflection
- **Uso**: Decorators e metadata (TypeScript)
- **Justificativa**: Requerido pelo NestJS

## Tecnologias de Desenvolvimento

### Testes

**@cucumber/cucumber**
- **Versão**: 12.2.x
- **Tipo**: BDD framework
- **Uso**: Testes BDD (Behavior-Driven Development)
- **Justificativa**: Testes de comportamento, Gherkin

**@cucumber/pretty-formatter**
- **Versão**: 2.4.x
- **Tipo**: Formatter
- **Uso**: Formatação de saída de testes
- **Justificativa**: Melhor visualização de resultados

**Jest**
- **Versão**: (via @nestjs/testing)
- **Tipo**: Testing framework
- **Uso**: Testes unitários e integração
- **Justificativa**: Padrão NestJS, TypeScript support

### Linting e Formatação

**ESLint**
- **Versão**: (via @typescript-eslint)
- **Tipo**: Linter
- **Uso**: Análise estática de código
- **Justificativa**: Qualidade de código, padrões

**Prettier**
- **Versão**: Latest
- **Tipo**: Code formatter
- **Uso**: Formatação automática
- **Justificativa**: Consistência, automatização

### Build e Deploy

**TypeScript Compiler**
- **Versão**: (via @nestjs/cli)
- **Tipo**: Compiler
- **Uso**: Compilação TypeScript → JavaScript
- **Justificativa**: Build para produção

**Docker**
- **Versão**: Latest
- **Tipo**: Containerization
- **Uso**: Empacotamento e deploy
- **Justificativa**: Portabilidade, isolamento

**Docker Compose**
- **Versão**: Latest
- **Tipo**: Orchestration
- **Uso**: Orquestração de containers
- **Justificativa**: Multi-container, desenvolvimento

## Infraestrutura

### Container Runtime

**Docker**
- **Base Image**: node:20-alpine
- **Tipo**: Container
- **Uso**: Execução da aplicação
- **Justificativa**: Isolamento, portabilidade, escalabilidade

### Reverse Proxy

**Traefik**
- **Versão**: Latest
- **Tipo**: Reverse proxy / Load balancer
- **Uso**: Roteamento, SSL/TLS termination
- **Justificativa**: Auto-discovery, Let's Encrypt, labels

### Orchestration

**Portainer**
- **Versão**: Latest
- **Tipo**: Docker management UI
- **Uso**: Gerenciamento de containers
- **Justificativa**: Interface gráfica, deploy simplificado

## Matriz Tecnologia-Uso

| Tecnologia | Categoria | Uso Principal | Versão |
|------------|-----------|---------------|--------|
| Node.js | Runtime | Execução | 20.x |
| TypeScript | Linguagem | Desenvolvimento | 5.x |
| NestJS | Framework | Estrutura | 10.x |
| PostgreSQL | Database | Dados | 14+ |
| TypeORM | ORM | Acesso a dados | 0.3.x |
| Redis | Cache | Performance | 7.x |
| JWT | Auth | Autenticação | - |
| MinIO | Storage | Arquivos | Latest |
| OpenAI | AI | NLP | Latest |
| Evolution API | WhatsApp | Integração | Latest |
| MCP SDK | Protocol | IA Tools | 1.20.x |
| Docker | Container | Deploy | Latest |
| Traefik | Proxy | Roteamento | Latest |

## Dependências Críticas

### Produção
- NestJS Core
- TypeORM
- PostgreSQL Driver
- JWT
- MinIO Client
- OpenAI Client (axios)
- Evolution SDK

### Desenvolvimento
- TypeScript
- NestJS CLI
- ESLint
- Prettier
- Cucumber

## Política de Atualização

**Major Updates**: Revisão e testes completos
**Minor Updates**: Testes de regressão
**Patch Updates**: Aplicação automática (via dependabot)

## Próximas Tecnologias

- [ ] Elasticsearch (busca avançada)
- [ ] Kafka (message queue)
- [ ] Prometheus (métricas)
- [ ] Grafana (dashboards)
- [ ] Sentry (error tracking)
- [ ] WebSocket (real-time)

