# Deploy no Portainer - Gwan Events Backend

## Configuração das Variáveis de Ambiente

No Portainer, configure as seguintes variáveis de ambiente:

### Variáveis Obrigatórias

```bash
# Configurações básicas
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=pazdedeus

# CORS para frontend
CORS_ORIGINS=https://events.gwan.com.br,https://www.events.gwan.com.br,https://api-events.gwan.com.br

# MCP Server
MCP_BASE_URL=https://api-events.gwan.com.br
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=pazdedeus2025
```

## Passos para Deploy

### 1. Build da Imagem

```bash
# Build da imagem Docker
docker build -t gwan-events-backend:latest .

# Tag para registry (se necessário)
docker tag gwan-events-backend:latest your-registry/gwan-events-backend:latest
docker push your-registry/gwan-events-backend:latest
```

### 2. Deploy no Portainer

1. **Acesse o Portainer**
2. **Vá em Stacks**
3. **Clique em "Add stack"**
4. **Cole o conteúdo do arquivo `portainer-stack.yml`**
5. **Configure as variáveis de ambiente** na seção "Environment variables"
6. **Clique em "Deploy the stack"**

### 3. Verificação

Após o deploy, verifique:

- **Container rodando:** `docker ps | grep gwan-events-backend`
- **Logs:** `docker logs gwan-events-backend`
- **Health check:** `curl -f http://localhost:3001/health`
- **HTTPS:** `https://api-events.gwan.com.br/api`

## Configuração do Traefik

O stack já está configurado para:
- **Domínio:** `api-events.gwan.com.br`
- **SSL:** Let's Encrypt automático
- **Rede:** Externa `gwan`

## Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker logs gwan-events-backend

# Verificar variáveis de ambiente
docker exec gwan-events-backend env | grep -E "(NODE_ENV|PORT|JWT_SECRET)"
```

### SSL não funciona
- Verificar se o domínio `api-events.gwan.com.br` aponta para o servidor
- Verificar se o Traefik está rodando
- Verificar logs do Traefik: `docker logs traefik`

### CORS não funciona
- Verificar se `CORS_ORIGINS` está configurado corretamente
- Verificar se o frontend está chamando de `events.gwan.com.br`

## Scripts Úteis

```bash
# Deploy automático
npm run portainer:deploy:prod

# Verificar status
npm run portainer:status

# Ver logs
npm run portainer:logs

# Rollback
npm run portainer:rollback
```

## Monitoramento

- **Health Check:** `http://localhost:3001/health`
- **API Docs:** `https://api-events.gwan.com.br/api`
- **MCP Server:** Configurado mas não exposto publicamente
