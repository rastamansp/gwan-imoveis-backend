# 🚀 Deploy Automático

## Visão Geral

O sistema de deploy automático do Gwan Events Backend garante que todas as mudanças sejam testadas, validadas e documentadas antes de serem enviadas para produção.

## Fluxo de Deploy

```mermaid
graph TB
    DEV[Desenvolvimento] --> VAL[Validação]
    VAL --> BUILD[Build]
    BUILD --> TEST[Testes]
    TEST --> DOCS[Documentação]
    DOCS --> DEPLOY[Deploy]
    DEPLOY --> MONITOR[Monitoramento]
    
    VAL --> |Falha| DEV
    BUILD --> |Falha| DEV
    TEST --> |Falha| DEV
    DOCS --> |Falha| DEV
    DEPLOY --> |Falha| ROLLBACK[Rollback]
    ROLLBACK --> DEV
```

## Scripts de Deploy

### Preparação para Deploy

```bash
# Preparar para deploy (build + documentação)
npm run deploy:prepare
```

Este comando executa:
1. **Build** do projeto (`npm run build`)
2. **Geração** de documentação (`npm run docs:generate`)
3. **Validação** de documentação (`npm run docs:validate`)

### Deploy para Produção

```bash
# Deploy completo para produção
npm run deploy:prod
```

Este comando executa:
1. **Preparação** (`npm run deploy:prepare`)
2. **Deploy** para produção
3. **Validação** pós-deploy

### Rollback

```bash
# Rollback em caso de problemas
npm run deploy:rollback
```

## Processo de Deploy Manual

### 1. Preparação Local

```bash
# 1. Desenvolvimento
npm run start:dev

# 2. Testes
npm run test
npm run test:e2e

# 3. Linting
npm run lint

# 4. Documentação
npm run docs:generate
npm run docs:validate

# 5. Build
npm run build
```

### 2. Commit e Push

```bash
# 1. Adicionar mudanças
git add .

# 2. Commit com mensagem descritiva
git commit -m "feat: nova funcionalidade de eventos"

# 3. Push para repositório
git push origin main
```

### 3. Deploy Automático

O deploy é executado automaticamente via GitHub Actions quando:
- Push é feito para a branch `main`
- Todos os testes passam
- Documentação é validada
- Build é bem-sucedido

## GitHub Actions

### Workflow de Deploy

O arquivo `.github/workflows/deploy.yml` contém o pipeline de deploy:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Run e2e tests
        run: npm run test:e2e
        
      - name: Build project
        run: npm run build
        
      - name: Generate documentation
        run: npm run docs:generate
        
      - name: Validate documentation
        run: npm run docs:validate
        
      - name: Deploy to production
        run: npm run deploy:prod
        env:
          NODE_ENV: production
```

### Triggers

- **Push para main**: Deploy automático
- **Workflow dispatch**: Deploy manual via GitHub UI

## Validações de Deploy

### Pré-Deploy

1. **Branch correta**: Deploy apenas da branch `main`
2. **Mudanças commitadas**: Não há mudanças não commitadas
3. **Commits enviados**: Há commits para deploy

### Durante o Deploy

1. **Dependências**: Instalação de dependências
2. **Testes**: Testes unitários e e2e
3. **Build**: Compilação do projeto
4. **Documentação**: Geração e validação
5. **Deploy**: Execução do deploy

### Pós-Deploy

1. **Health Check**: Verificação de saúde da aplicação
2. **Documentação**: Verificação de acessibilidade
3. **Monitoramento**: Início do monitoramento

## Configurações de Produção

### Variáveis de Ambiente

```env
# Produção
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/gwan_events

# JWT
JWT_SECRET=super-secret-jwt-key-production

# CORS
CORS_ORIGINS=https://events.gwan.com.br,https://www.events.gwan.com.br

# MCP
MCP_BASE_URL=https://api.gwan.com.br
MCP_AUTH_TOKEN=production-mcp-token
```

### Configurações de Servidor

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped
```

## Monitoramento

### Health Checks

```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

### Logs de Deploy

Os logs de deploy são salvos em `deploy.log`:

```
[2024-01-15T10:30:00.000Z] SUCCESS: Deploy concluído com sucesso
[2024-01-15T10:25:00.000Z] INFO: Validação pós-deploy concluída
[2024-01-15T10:20:00.000Z] INFO: Deploy executado
```

## Troubleshooting

### Problemas Comuns

#### Deploy Falha nos Testes
```bash
# Executar testes localmente
npm run test
npm run test:e2e

# Corrigir problemas
# Fazer commit das correções
git add .
git commit -m "fix: corrigir testes"
git push origin main
```

#### Deploy Falha na Documentação
```bash
# Gerar documentação localmente
npm run docs:generate

# Validar documentação
npm run docs:validate

# Corrigir problemas
# Fazer commit das correções
git add .
git commit -m "fix: corrigir documentação"
git push origin main
```

#### Deploy Falha no Build
```bash
# Build local
npm run build

# Verificar erros de TypeScript
npx tsc --noEmit

# Corrigir problemas
# Fazer commit das correções
git add .
git commit -m "fix: corrigir build"
git push origin main
```

### Rollback Manual

```bash
# 1. Identificar commit anterior
git log --oneline

# 2. Reverter para commit anterior
git reset --hard <commit-hash>

# 3. Force push (cuidado!)
git push --force origin main

# 4. Deploy automático será executado
```

## Segurança

### Boas Práticas

1. **Nunca commitar** credenciais ou secrets
2. **Usar variáveis de ambiente** para configurações sensíveis
3. **Validar** todas as entradas antes do deploy
4. **Monitorar** logs de produção
5. **Backup** regular do banco de dados

### Secrets do GitHub

Configure os seguintes secrets no GitHub:

- `DATABASE_URL`: URL do banco de produção
- `JWT_SECRET`: Chave secreta JWT
- `MCP_AUTH_TOKEN`: Token de autenticação MCP
- `DEPLOY_TOKEN`: Token para deploy

## Próximos Passos

1. [Configuração de Ambiente](./environment.md) - Configuração detalhada
2. Configurar ambiente de produção
3. Implementar monitoramento
4. Configurar backup automático
