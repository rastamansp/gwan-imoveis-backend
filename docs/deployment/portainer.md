# 🐳 Deploy com Portainer

## Visão Geral

Este guia explica como fazer deploy da aplicação Gwan Events Backend usando Portainer, uma interface web para gerenciar containers Docker.

## Pré-requisitos

### Portainer Instalado
- Portainer instalado e configurado
- Acesso administrativo ao Portainer
- Rede Docker `gwan` criada

### Rede Docker
```bash
# Criar rede externa gwan
docker network create gwan
```

## Configuração no Portainer

### 1. Criar Stack

1. Acesse o Portainer
2. Vá para **Stacks** > **Add Stack**
3. Nome: `gwan-events-backend`
4. Cole o conteúdo do arquivo `portainer-stack.yml`

### 2. Configurar Variáveis de Ambiente

No Portainer, configure as seguintes variáveis de ambiente:

#### Configurações Básicas
```env
NODE_ENV=production
PORT=3001
```

#### JWT
```env
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=24h
```

#### Database
```env
DATABASE_URL=postgresql://postgres:senha@postgres:5432/gwan_events
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=senha-super-segura-aqui
DATABASE_NAME=gwan_events
```

#### Redis
```env
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=senha-redis-segura-aqui
REDIS_DB=0
```

#### CORS
```env
CORS_ORIGINS=https://events.gwan.com.br,https://www.events.gwan.com.br
```

#### MCP Server
```env
MCP_BASE_URL=https://api-events.gwan.com.br
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=token-mcp-super-seguro-aqui
```

#### Email
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gwan.com.br
SMTP_PASS=senha-app-gmail-aqui
SMTP_FROM=noreply@gwan.com.br
```

#### Payment Gateway
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR_xxx
```

#### AWS S3
```env
AWS_ACCESS_KEY_ID=AKIAxxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=gwan-events-uploads
```

#### Logging
```env
LOG_LEVEL=info
```

### 3. Configurar Build

#### Opção 1: Build Local
1. Faça build da imagem localmente:
```bash
docker build -t gwan-events-backend:latest .
```

2. Envie para registry:
```bash
docker tag gwan-events-backend:latest seu-registry/gwan-events-backend:latest
docker push seu-registry/gwan-events-backend:latest
```

#### Opção 2: Build no Portainer
1. Configure o build context no Portainer
2. Use o Dockerfile do projeto
3. Configure o contexto de build

### 4. Deploy da Stack

1. Clique em **Deploy the Stack**
2. Aguarde o deploy completar
3. Verifique os logs dos containers

## Monitoramento

### Verificar Status
1. Vá para **Containers**
2. Verifique se todos os containers estão rodando
3. Clique em **Logs** para ver os logs

### Health Checks
Os containers incluem health checks automáticos:
- **Backend**: `http://localhost:3001/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

### Logs
```bash
# Via Portainer UI
1. Vá para Containers
2. Clique no container
3. Vá para Logs

# Via CLI
docker logs gwan-events-backend
docker logs gwan-events-postgres
docker logs gwan-events-redis
```

## Configuração do Traefik

### Labels Traefik
O stack inclui labels Traefik para:
- **API**: `api-events.gwan.com.br`
- **SSL**: Certificados Let's Encrypt
- **Proxy**: Load balancing

### Configuração do Traefik
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.gwan-events-backend.rule=Host(`api-events.gwan.com.br`)"
  - "traefik.http.routers.gwan-events-backend.tls=true"
  - "traefik.http.routers.gwan-events-backend.tls.certresolver=letsencrypt"
  - "traefik.http.services.gwan-events-backend.loadbalancer.server.port=3001"
```

## Troubleshooting

### Problemas Comuns

#### Container não inicia
1. Verifique os logs no Portainer
2. Verifique as variáveis de ambiente
3. Verifique se a rede `gwan` existe

#### Erro de conexão com banco
1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais do banco
3. Verifique a conectividade de rede

#### Erro de rede
1. Verifique se a rede `gwan` existe:
```bash
docker network ls | grep gwan
```

2. Recrie a rede se necessário:
```bash
docker network rm gwan
docker network create gwan
```

### Comandos Úteis

#### Via Portainer UI
- **Containers**: Ver status e logs
- **Stacks**: Gerenciar stacks
- **Images**: Gerenciar imagens
- **Networks**: Gerenciar redes
- **Volumes**: Gerenciar volumes

#### Via CLI
```bash
# Status dos containers
docker ps

# Logs em tempo real
docker logs -f gwan-events-backend

# Executar comando no container
docker exec -it gwan-events-backend sh

# Reiniciar container
docker restart gwan-events-backend
```

## Backup e Restore

### Backup de Volumes
```bash
# Backup PostgreSQL
docker run --rm -v gwan-events-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup Redis
docker run --rm -v gwan-events-backend_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Backup Uploads
docker run --rm -v gwan-events-backend_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

### Restore de Volumes
```bash
# Restore PostgreSQL
docker run --rm -v gwan-events-backend_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data

# Restore Redis
docker run --rm -v gwan-events-backend_redis_data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data

# Restore Uploads
docker run --rm -v gwan-events-backend_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Atualizações

### Atualizar Stack
1. Vá para **Stacks** no Portainer
2. Clique em **Editor** na stack `gwan-events-backend`
3. Atualize o código
4. Clique em **Update the Stack**

### Atualizar Imagem
1. Faça build da nova imagem
2. Atualize a tag no Portainer
3. Redeploy a stack

### Rollback
1. Vá para **Stacks**
2. Clique em **Editor**
3. Reverta para versão anterior
4. Clique em **Update the Stack**

## Segurança

### Boas Práticas
1. **Nunca** commitar arquivos `.env`
2. **Usar** secrets para dados sensíveis
3. **Configurar** firewall adequadamente
4. **Monitorar** logs regularmente
5. **Fazer backup** dos volumes

### Configurações de Segurança
- **Restart Policy**: `unless-stopped`
- **Health Checks**: Verificação automática
- **Resource Limits**: Limites de memória e CPU
- **Network Isolation**: Rede interna

## Próximos Passos

1. [Deploy Automático](./deploy-automation.md) - Deploy automático
2. [Deploy com Docker](./docker.md) - Deploy com Docker
3. [Configuração de Ambiente](./environment.md) - Configuração detalhada
4. [Monitoramento](./monitoring.md) - Sistema de monitoramento
5. [Backup](./backup.md) - Estratégias de backup
