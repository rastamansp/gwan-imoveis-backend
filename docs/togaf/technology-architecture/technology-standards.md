# Technology Standards - Padrões Tecnológicos

## Visão Geral

Este documento define os **padrões tecnológicos** adotados na plataforma Litoral Imóveis, garantindo consistência, qualidade e manutenibilidade.

## Padrões de Desenvolvimento

### 1. Linguagem e Runtime

**TypeScript**
- Versão mínima: 5.x
- Strict mode: Habilitado
- Target: ES2020
- Module: CommonJS (build)

**Node.js**
- Versão: 20.x LTS
- Runtime: Alpine Linux (containers)

**Justificativa**: Type safety, melhor DX, suporte a recursos modernos

### 2. Framework e Arquitetura

**NestJS**
- Versão: 10.x
- Arquitetura: Clean Architecture
- Padrões: SOLID, DDD

**Estrutura de Camadas**:
- Presentation (Controllers, DTOs)
- Application (Use Cases)
- Domain (Entities, Value Objects)
- Infrastructure (Repositories, Services)

**Justificativa**: Escalabilidade, manutenibilidade, padrões enterprise

### 3. Banco de Dados

**PostgreSQL**
- Versão mínima: 14+
- ORM: TypeORM 0.3.x
- Migrations: TypeORM migrations

**Padrões**:
- Nomes de tabelas: snake_case, plural
- Nomes de colunas: snake_case
- IDs: UUID v4
- Timestamps: createdAt, updatedAt
- Soft delete: (futuro)

**Justificativa**: Confiabilidade, performance, recursos avançados

### 4. Validação e Transformação

**class-validator**
- Validação de DTOs
- Decorators para validação
- Mensagens de erro customizadas

**class-transformer**
- Transformação de objetos
- Serialização
- Deserialização

**Padrões**:
- Validação em DTOs
- Transformação automática
- Mensagens de erro claras

### 5. Autenticação e Segurança

**JWT**
- Algoritmo: HS256
- Expiração: Configurável
- Refresh tokens: (futuro)

**Passport**
- Estratégias: JWT, Local
- Guards: JwtAuthGuard, LocalAuthGuard

**Segurança**:
- Senhas: bcrypt (10 rounds)
- HTTPS obrigatório
- CORS configurado
- Rate limiting (futuro)

### 6. Armazenamento de Arquivos

**MinIO**
- S3-compatible API
- Buckets organizados por tipo
- URLs públicas

**Processamento**:
- Sharp para redimensionamento
- Thumbnails automáticos
- Otimização de qualidade

**Padrões**:
- Estrutura: `bucket/type/{id}/{filename}`
- Nomenclatura: `{timestamp}-{description}-{index}.{ext}`
- Thumbnails: `thumb-{filename}`

### 7. Cache

**Redis**
- TTL automático
- Estruturas de dados ricas
- Clustering (futuro)

**Padrões**:
- Chaves: `{entity}:{identifier}`
- TTL: 1 hora (padrão)
- Invalidação: On update/delete

### 8. Logging

**NestJS Logger**
- Logs estruturados (JSON)
- Níveis: DEBUG, INFO, WARN, ERROR
- Contexto automático

**Padrões**:
- Formato: JSON
- Níveis apropriados
- Contexto incluído
- Stack traces para erros

### 9. Testes

**BDD**: Cucumber.js
- Features: Gherkin syntax
- Steps: TypeScript
- Formatter: Pretty

**Unit Tests**: Jest
- Coverage: > 80% (objetivo)
- Mocks: Quando necessário

**Padrões**:
- BDD para testes de integração
- Unit tests para lógica complexa
- Testes de regressão

### 10. Documentação

**API**: Swagger/OpenAPI
- Geração automática
- Documentação interativa
- Exemplos

**Código**: JSDoc/TSDoc
- Comentários em funções complexas
- Documentação de interfaces

**Arquitetura**: Markdown + Mermaid
- Diagramas Mermaid
- Documentação estruturada

## Padrões de Código

### 1. Nomenclatura

**Classes**: PascalCase
```typescript
class PropertyService {}
```

**Interfaces**: PascalCase com prefixo I
```typescript
interface IPropertyRepository {}
```

**Métodos/Variáveis**: camelCase
```typescript
const propertyId = 'uuid';
async getPropertyById(id: string) {}
```

**Constantes**: UPPER_SNAKE_CASE
```typescript
const MAX_RETRY_ATTEMPTS = 3;
```

**Arquivos**: kebab-case
```typescript
property.service.ts
property.controller.ts
```

**Módulos**: kebab-case plural
```typescript
properties.module.ts
```

### 2. Estrutura de Arquivos

**Padrão por Módulo**:
```
module-name/
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
├── dtos/
│   ├── create-module-name.dto.ts
│   └── module-name-response.dto.ts
└── interfaces/
    └── module-name.interface.ts
```

### 3. Imports

**Ordem**:
1. External libraries
2. NestJS modules
3. Internal modules
4. Types/interfaces

**Exemplo**:
```typescript
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
```

### 4. Decorators

**Ordem**:
1. Class decorators
2. Method decorators
3. Parameter decorators
4. Property decorators

**Exemplo**:
```typescript
@Controller('properties')
export class PropertiesController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filters: ListPropertiesDto) {}
}
```

### 5. Error Handling

**Padrão**:
- Custom exceptions para erros de domínio
- HttpException para erros HTTP
- Exception filters globais
- Logs estruturados

**Exemplo**:
```typescript
throw new PropertyNotFoundException('Property not found');
```

## Padrões de API

### 1. RESTful

**Endpoints**:
- GET: Consulta
- POST: Criação
- PUT: Atualização completa
- PATCH: Atualização parcial
- DELETE: Remoção

**Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### 2. Versionamento

**Atual**: Implícito (v1)  
**Futuro**: `/api/v1`, `/api/v2`

### 3. Paginação

**Padrão** (Futuro):
- Query params: `page`, `limit`
- Response: `{ data, total, page, limit }`

### 4. Filtros

**Padrão**:
- Query parameters
- Validação via DTOs
- Documentação Swagger

## Padrões de Deploy

### 1. Containers

**Base Image**: `node:20-alpine`
- Multi-stage build
- Non-root user
- Health checks

### 2. Environment Variables

**Nomenclatura**: UPPER_SNAKE_CASE
```bash
DATABASE_URL=...
JWT_SECRET=...
OPENAI_API_KEY=...
```

### 3. Secrets

**Atual**: Environment variables
**Futuro**: Docker Secrets, Vault

## Padrões de Versionamento

### 1. Git

**Branches**:
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/*`: Features
- `hotfix/*`: Hotfixes

**Commits**:
- Conventional Commits
- Prefixos: `feat:`, `fix:`, `docs:`, `refactor:`

### 2. SemVer

**Versões**: `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

## Padrões de Qualidade

### 1. Code Review

**Requisitos**:
- Pelo menos 1 aprovação
- Testes passando
- Linting passando
- Documentação atualizada

### 2. Linting

**ESLint**: Configurado
- TypeScript rules
- NestJS best practices
- Auto-fix quando possível

### 3. Formatação

**Prettier**: Configurado
- Formatação automática
- Consistência de estilo

## Próximos Padrões

- [ ] Padrões de observabilidade (tracing, metrics)
- [ ] Padrões de rate limiting
- [ ] Padrões de circuit breaker
- [ ] Padrões de retry
- [ ] Padrões de idempotência

