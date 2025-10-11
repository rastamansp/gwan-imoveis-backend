# 🐳 Deploy Rápido com Docker

## Deploy para Produção

### 1. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar variáveis de ambiente
nano .env
```

### 2. Criar Rede Docker
```bash
# Criar rede externa gwan
docker network create gwan
```

### 3. Deploy Automático
```bash
# Linux/Mac
npm run portainer:deploy:prod

# Windows
npm run portainer:deploy:prod:win

# Ou manualmente
docker-compose -f docker-compose.prod.yml up -d --build
```

## Deploy para Desenvolvimento

### 1. Deploy Automático
```bash
# Linux/Mac
npm run portainer:deploy:dev

# Windows
npm run portainer:deploy:dev:win

# Ou manualmente
docker-compose -f docker-compose.dev.yml up -d --build
```

## Monitoramento

### Verificar Status
```bash
# Linux/Mac
npm run portainer:status

# Windows
npm run portainer:status:win

# Ou manualmente
docker-compose ps
```

### Ver Logs
```bash
# Linux/Mac
npm run portainer:logs

# Windows
npm run portainer:logs:win

# Ou manualmente
docker-compose logs -f
```

## Rollback

### Em Caso de Problemas
```bash
# Linux/Mac
npm run portainer:rollback

# Windows
npm run portainer:rollback:win

# Ou manualmente
docker-compose down -v
```

## Portainer

### Configuração no Portainer
1. Acesse o Portainer
2. Vá para **Stacks** > **Add Stack**
3. Nome: `gwan-events-backend`
4. Cole o conteúdo do arquivo `portainer-stack.yml`
5. Configure as variáveis de ambiente
6. Clique em **Deploy the Stack**

### Variáveis de Ambiente Obrigatórias
```env
JWT_SECRET=seu-jwt-secret-super-seguro
DATABASE_PASSWORD=senha-banco-segura
REDIS_PASSWORD=senha-redis-segura
```

## Troubleshooting

### Problemas Comuns
1. **Rede não encontrada**: `docker network create gwan`
2. **Container não inicia**: Verificar logs com `docker-compose logs`
3. **Erro de banco**: Verificar se PostgreSQL está rodando
4. **Erro de Redis**: Verificar se Redis está rodando

### Comandos Úteis
```bash
# Status dos containers
docker ps

# Logs em tempo real
docker logs -f gwan-events-backend

# Executar comando no container
docker exec -it gwan-events-backend sh

# Reiniciar container
docker restart gwan-events-backend

# Limpar tudo
docker-compose down -v --rmi all
```

## Estrutura dos Containers

- **gwan-events-backend**: Aplicação principal
- **gwan-events-postgres**: Banco de dados PostgreSQL
- **gwan-events-redis**: Cache Redis
- **gwan-events-mcp**: Servidor MCP (opcional)

## Volumes Persistentes

- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `uploads_data`: Arquivos enviados
- `logs_data`: Logs da aplicação

## Rede

- **gwan**: Rede externa para comunicação entre containers

## Health Checks

- **Backend**: `http://localhost:3001/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

## Domínios

- **API**: `api-events.gwan.com.br`
- **MCP**: `mcp.gwan.com.br` (opcional)

## SSL

- Certificados Let's Encrypt automáticos
- Configuração via Traefik

## Backup

### Backup de Volumes
```bash
# Backup PostgreSQL
docker run --rm -v gwan-events-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup Redis
docker run --rm -v gwan-events-backend_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Backup Uploads
docker run --rm -v gwan-events-backend_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

## Próximos Passos

1. [Deploy com Docker](./docs/deployment/docker.md) - Guia completo
2. [Deploy com Portainer](./docs/deployment/portainer.md) - Guia do Portainer
3. [Deploy Automático](./docs/deployment/deploy-automation.md) - Deploy automático
4. [Configuração de Ambiente](./docs/deployment/environment.md) - Configuração detalhada
