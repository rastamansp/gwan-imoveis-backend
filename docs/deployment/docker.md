# 🐳 Deploy com Docker

## Visão Geral

O projeto inclui configurações Docker completas para deploy em diferentes ambientes, incluindo integração com Portainer e a rede externa `gwan`.

## Arquivos Docker

### docker-compose.yml
Arquivo principal para deploy padrão com todas as configurações.

### docker-compose.prod.yml
Configuração específica para produção com otimizações e segurança.

### docker-compose.dev.yml
Configuração para desenvolvimento com hot reload e debug.

## Estrutura dos Containers

```mermaid
graph TB
    subgraph "Rede Gwan"
        APP[gwan-events-backend]
        DB[(PostgreSQL)]
        REDIS[(Redis)]
        MCP[gwan-events-mcp]
    end
    
    subgraph "Traefik (Proxy)"
        TRAEFIK[Traefik]
    end
    
    subgraph "Volumes"
        POSTGRES_DATA[postgres_data]
        REDIS_DATA[redis_data]
        UPLOADS_DATA[uploads_data]
        LOGS_DATA[logs_data]
    end
    
    TRAEFIK --> APP
    APP --> DB
    APP --> REDIS
    MCP --> APP
    
    DB --> POSTGRES_DATA
    REDIS --> REDIS_DATA
    APP --> UPLOADS_DATA
    APP --> LOGS_DATA
```

## Configuração da Rede

### Rede Externa Gwan
```yaml
networks:
  gwan:
    external: true
```

A rede `gwan` deve existir no Docker antes do deploy:
```bash
docker network create gwan
```

## Variáveis de Ambiente

### Arquivo .env
```env
# Configurações básicas
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/gwan_events
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=senha-super-segura
DATABASE_NAME=gwan_events

# Redis
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=senha-redis-segura
REDIS_DB=0

# CORS
CORS_ORIGINS=https://events.gwan.com.br,https://www.events.gwan.com.br

# MCP Server
MCP_BASE_URL=https://api-events.gwan.com.br
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=token-mcp-super-seguro

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gwan.com.br
SMTP_PASS=senha-app-gmail
SMTP_FROM=noreply@gwan.com.br

# Payment Gateway
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR_xxx

# File Upload
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=5242880

# AWS S3
AWS_ACCESS_KEY_ID=AKIAxxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=gwan-events-uploads

# Logging
LOG_LEVEL=info
```

## Deploy com Portainer

### 1. Preparação

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar variáveis de ambiente
nano .env

# Tornar script executável (Linux/Mac)
chmod +x scripts/deploy-portainer.sh
```

### 2. Deploy via Script

```bash
# Deploy para produção
./scripts/deploy-portainer.sh deploy prod

# Deploy para desenvolvimento
./scripts/deploy-portainer.sh deploy dev

# Deploy padrão
./scripts/deploy-portainer.sh deploy
```

### 3. Deploy Manual

```bash
# Produção
docker-compose -f docker-compose.prod.yml up -d --build

# Desenvolvimento
docker-compose -f docker-compose.dev.yml up -d --build

# Padrão
docker-compose up -d --build
```

## Configuração do Traefik

### Labels Traefik
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.gwan-events-backend.rule=Host(`api-events.gwan.com.br`)"
  - "traefik.http.routers.gwan-events-backend.tls=true"
  - "traefik.http.routers.gwan-events-backend.tls.certresolver=letsencrypt"
  - "traefik.http.services.gwan-events-backend.loadbalancer.server.port=3001"
```

### Domínios Configurados
- **API**: `api-events.gwan.com.br`
- **MCP**: `mcp.gwan.com.br` (opcional)

## Health Checks

### Configuração
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Endpoint de Health
```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Volumes Persistentes

### Volumes Configurados
- `postgres_data` - Dados do PostgreSQL
- `redis_data` - Dados do Redis
- `uploads_data` - Arquivos enviados
- `logs_data` - Logs da aplicação

### Backup de Volumes
```bash
# Backup do PostgreSQL
docker run --rm -v gwan-events-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup do Redis
docker run --rm -v gwan-events-backend_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

## Monitoramento

### Logs
```bash
# Logs da aplicação
docker-compose logs -f gwan-events-backend

# Logs do banco
docker-compose logs -f postgres

# Logs do Redis
docker-compose logs -f redis

# Logs do MCP
docker-compose logs -f gwan-events-mcp
```

### Status dos Containers
```bash
# Status geral
docker-compose ps

# Status detalhado
docker-compose ps -a

# Uso de recursos
docker stats
```

## Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose logs gwan-events-backend

# Verificar configuração
docker-compose config

# Reiniciar container
docker-compose restart gwan-events-backend
```

#### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Testar conexão
docker-compose exec postgres psql -U postgres -d gwan_events -c "SELECT 1;"
```

#### Erro de rede
```bash
# Verificar rede
docker network ls | grep gwan

# Recriar rede
docker network rm gwan
docker network create gwan
```

### Comandos Úteis

```bash
# Parar todos os containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Rebuild sem cache
docker-compose build --no-cache

# Executar comando no container
docker-compose exec gwan-events-backend npm run docs:generate

# Acessar shell do container
docker-compose exec gwan-events-backend sh
```

## Scripts de Deploy

### deploy-portainer.sh
Script automatizado para deploy via Portainer com as seguintes funcionalidades:

- **deploy**: Fazer deploy da aplicação
- **rollback**: Fazer rollback da aplicação
- **status**: Verificar status dos containers
- **logs**: Ver logs dos containers

### Uso
```bash
# Deploy para produção
./scripts/deploy-portainer.sh deploy prod

# Verificar status
./scripts/deploy-portainer.sh status prod

# Ver logs
./scripts/deploy-portainer.sh logs prod

# Rollback
./scripts/deploy-portainer.sh rollback prod
```

## Segurança

### Boas Práticas
1. **Nunca commitar** arquivos `.env`
2. **Usar secrets** para dados sensíveis
3. **Configurar firewall** adequadamente
4. **Monitorar logs** regularmente
5. **Fazer backup** dos volumes

### Configurações de Segurança
```yaml
# Restart policy
restart: unless-stopped

# Health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3

# Resource limits
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

## Próximos Passos

1. [Deploy Automático](./deploy-automation.md) - Deploy automático
2. [Configuração de Ambiente](./environment.md) - Configuração detalhada
3. [Monitoramento](./monitoring.md) - Sistema de monitoramento
4. [Backup](./backup.md) - Estratégias de backup
