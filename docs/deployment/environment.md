# 🚀 Configuração de Ambiente

## Visão Geral

Este guia detalha como configurar o ambiente de produção para o Gwan Events Backend, incluindo configurações de banco de dados, cache, autenticação e monitoramento.

## Arquitetura de Produção

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "Application Servers"
        APP1[App Server 1]
        APP2[App Server 2]
        APP3[App Server 3]
    end
    
    subgraph "Database Cluster"
        DB_MASTER[(PostgreSQL Master)]
        DB_SLAVE1[(PostgreSQL Slave 1)]
        DB_SLAVE2[(PostgreSQL Slave 2)]
    end
    
    subgraph "Cache Layer"
        REDIS_MASTER[(Redis Master)]
        REDIS_SLAVE[(Redis Slave)]
    end
    
    subgraph "File Storage"
        S3[AWS S3/MinIO]
    end
    
    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ELK[ELK Stack]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> DB_MASTER
    APP2 --> DB_MASTER
    APP3 --> DB_MASTER
    
    DB_MASTER --> DB_SLAVE1
    DB_MASTER --> DB_SLAVE2
    
    APP1 --> REDIS_MASTER
    APP2 --> REDIS_MASTER
    APP3 --> REDIS_MASTER
    
    REDIS_MASTER --> REDIS_SLAVE
    
    APP1 --> S3
    APP2 --> S3
    APP3 --> S3
    
    APP1 --> PROMETHEUS
    APP2 --> PROMETHEUS
    APP3 --> PROMETHEUS
    
    PROMETHEUS --> GRAFANA
    APP1 --> ELK
    APP2 --> ELK
    APP3 --> ELK
```

## Variáveis de Ambiente

### Configurações Básicas

```env
# Ambiente
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGINS=https://events.gwan.com.br,https://www.events.gwan.com.br
```

### Banco de Dados

```env
# PostgreSQL
DATABASE_URL=postgresql://username:password@db-master:5432/gwan_events
DATABASE_HOST=db-master
DATABASE_PORT=5432
DATABASE_USERNAME=gwan_user
DATABASE_PASSWORD=senha-super-segura
DATABASE_NAME=gwan_events

# Pool de conexões
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE=10000
```

### Cache Redis

```env
# Redis
REDIS_URL=redis://redis-master:6379
REDIS_HOST=redis-master
REDIS_PORT=6379
REDIS_PASSWORD=senha-redis-segura
REDIS_DB=0

# Configurações de cache
CACHE_TTL=3600
SESSION_TTL=86400
```

### Email

```env
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gwan.com.br
SMTP_PASS=senha-app-gmail
SMTP_FROM=noreply@gwan.com.br

# SendGrid (alternativo)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM=noreply@gwan.com.br
```

### Pagamentos

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR_xxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR_xxx
```

### Upload de Arquivos

```env
# AWS S3
AWS_ACCESS_KEY_ID=AKIAxxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=gwan-events-uploads

# MinIO (alternativo)
MINIO_ENDPOINT=minio.gwan.com.br
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=gwan-events-uploads
```

### MCP Server

```env
# MCP Configuration
MCP_BASE_URL=https://api.gwan.com.br
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=token-mcp-super-seguro
```

## Configuração do Banco de Dados

### PostgreSQL

#### Configuração do Servidor

```sql
-- postgresql.conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Criação do Banco

```sql
-- Criar usuário
CREATE USER gwan_user WITH PASSWORD 'senha-super-segura';

-- Criar banco
CREATE DATABASE gwan_events OWNER gwan_user;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE gwan_events TO gwan_user;
```

#### Migrações

```bash
# Executar migrações
npm run migration:run

# Verificar status
npm run migration:show
```

### Redis

#### Configuração do Servidor

```conf
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Teste de Conexão

```bash
# Testar conexão
redis-cli -h redis-master -p 6379 -a senha-redis-segura ping
```

## Configuração do Nginx

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/gwan-events
upstream gwan_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.gwan.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.gwan.com.br;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.gwan.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gwan.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy Configuration
    location / {
        proxy_pass http://gwan_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static Files
    location /uploads/ {
        alias /var/www/gwan-events/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health Check
    location /health {
        access_log off;
        proxy_pass http://gwan_backend;
    }
}
```

## Configuração do PM2

### PM2 Configuration

```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'gwan-events-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/gwan-events/error.log',
      out_file: '/var/log/gwan-events/out.log',
      log_file: '/var/log/gwan-events/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'gwan-events-mcp',
      script: 'dist/mcp/server-stdio.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/gwan-events/mcp-error.log',
      out_file: '/var/log/gwan-events/mcp-out.log',
      log_file: '/var/log/gwan-events/mcp-combined.log',
      time: true
    }
  ]
};
```

### Comandos PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Monitorar
pm2 monit

# Logs
pm2 logs gwan-events-api
pm2 logs gwan-events-mcp

# Reiniciar
pm2 restart gwan-events-api

# Parar
pm2 stop gwan-events-api

# Deletar
pm2 delete gwan-events-api
```

## Monitoramento

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gwan-events-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "Gwan Events API",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

## Backup e Recuperação

### Backup do Banco de Dados

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gwan-events"
DB_NAME="gwan_events"
DB_USER="gwan_user"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup completo
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compactar
gzip $BACKUP_DIR/backup_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup criado: backup_$DATE.sql.gz"
```

### Restauração do Banco

```bash
#!/bin/bash
# restore-db.sh

BACKUP_FILE=$1
DB_NAME="gwan_events"
DB_USER="gwan_user"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup>"
    exit 1
fi

# Descompactar se necessário
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql -h localhost -U $DB_USER -d $DB_NAME
else
    psql -h localhost -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

echo "Banco restaurado com sucesso"
```

## Segurança

### Firewall Configuration

```bash
# UFW (Ubuntu)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
ufw allow 6379/tcp
ufw enable
```

### SSL/TLS

```bash
# Certbot para Let's Encrypt
certbot --nginx -d api.gwan.com.br

# Renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## Próximos Passos

1. [Deploy Automático](./deploy-automation.md) - Deploy automático
2. Configurar ambiente de produção
3. Implementar monitoramento
4. Configurar backup automático
