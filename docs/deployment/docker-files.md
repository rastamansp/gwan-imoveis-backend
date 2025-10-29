# Dockerfiles - Produção

Este documento explica os diferentes Dockerfiles disponíveis no projeto.

## Dockerfile (Produção - Sem Migrations)

**Arquivo:** `Dockerfile`

**Uso:** Para produção onde o banco de dados já existe e não precisa de migrations.

**Características:**
- ✅ Build apenas com dependências de produção (`npm ci --only=production`)
- ✅ Não executa migrations na inicialização
- ✅ Menor tamanho da imagem
- ✅ Início mais rápido

**Quando usar:**
- Deploy em produção com banco já configurado
- Quando migrations são gerenciadas manualmente
- Quando não há necessidade de executar migrations automaticamente

**Comando:**
```bash
docker build -t gwan-events-backend .
```

## Dockerfile.with-migrations (Produção - Com Migrations)

**Arquivo:** `Dockerfile.with-migrations`

**Uso:** Para produção onde migrations precisam ser executadas automaticamente.

**Características:**
- ✅ Instala todas as dependências (incluindo dev)
- ✅ Executa migrations automaticamente na inicialização
- ✅ Script entrypoint com health check
- ✅ Aguarda PostgreSQL estar disponível

**Quando usar:**
- Deploy em novo ambiente
- Quando migrations precisam ser executadas automaticamente
- Quando o banco é criado do zero

**Comando:**
```bash
docker build -f Dockerfile.with-migrations -t gwan-events-backend .
```

## docker-entrypoint.sh

**Arquivo:** `docker-entrypoint.sh`

**Descrição:** Script de entrada para containers que precisam executar migrations.

**Funcionalidades:**
1. Aguarda PostgreSQL estar disponível (health check)
2. Executa migrations automaticamente
3. Continua o startup mesmo se migrations falharem (caso já aplicadas)
4. Inicia a aplicação NestJS

**Logs esperados:**
```
🎯 Starting Gwan Events Backend...
⏳ Waiting for PostgreSQL at db:5432...
✅ PostgreSQL is ready!
📦 Running database migrations...
✅ Migrations completed successfully
🚀 Starting NestJS application...
```

**Parâmetros:**
- `DB_HOST` - Host do PostgreSQL
- `DB_PORT` - Porta do PostgreSQL (padrão: 5432)

## Diferenças Principais

| Característica | Dockerfile | Dockerfile.with-migrations |
|---------------|------------|---------------------------|
| Dependências | Produção apenas | Todas (prod + dev) |
| Tamanho da imagem | Menor | Maior |
| Migrations | ❌ Não executa | ✅ Executa automaticamente |
| Health check | ❌ Não | ✅ Sim (PostgreSQL) |
| Use case | Produção estável | Deploy inicial |

## Recomendação

**Para o ambiente atual (produção com banco existente):**
- Use `Dockerfile` (sem migrations)
- Migrations devem ser gerenciadas manualmente via ssh/console
- Deploy mais rápido e estável

**Para novos ambientes ou quando necessário:**
- Use `Dockerfile.with-migrations`
- Configure as variáveis de ambiente no `docker-compose.production.yml`
- Migrations executam automaticamente na inicialização

## Como Alternar

### No docker-compose.production.yml

```yaml
services:
  gwan-events-backend:
    build:
      context: .
      dockerfile: Dockerfile  # ou Dockerfile.with-migrations
```

### Variáveis de Ambiente Necessárias

Para `Dockerfile.with-migrations`, adicione no `docker-compose.production.yml`:

```yaml
environment:
  - DB_HOST=${DB_HOST}
  - DB_PORT=${DB_PORT}
  - DB_USER=${DB_USER}
  - DB_PASSWORD=${DB_PASSWORD}
  - DB_NAME=${DB_NAME}
```

## Troubleshooting

### Erro: "column already exists"

**Causa:** Migration tentando criar coluna que já existe no banco.

**Solução:**
1. Use `Dockerfile` (sem migrations)
2. Ou ajuste a migration para verificar se coluna existe antes de criar

### Erro: "Cannot find module '/app/dist/main.js'"

**Causa:** Build não foi executado ou falhou.

**Solução:**
1. Verifique se `npm run build` está no Dockerfile
2. Verifique logs do build: `docker-compose logs -f gwan-events-backend`

### Erro: "Failed to deploy a stack"

**Causa:** Dockerfile tentando executar migrations durante o build.

**Solução:**
1. Use `Dockerfile` em vez de `Dockerfile.with-migrations`
2. Remova `ENTRYPOINT` do Dockerfile padrão

