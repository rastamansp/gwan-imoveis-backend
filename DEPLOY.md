# 🚀 Guia de Deploy Rápido

## Deploy Automático

O projeto possui deploy automático configurado via GitHub Actions. Para fazer deploy:

### 1. Desenvolvimento Local

```bash
# Desenvolver funcionalidade
npm run start:dev

# Testar localmente
npm run test
npm run test:e2e

# Gerar documentação
npm run docs:generate
npm run docs:validate
```

### 2. Commit e Push

```bash
# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "feat: nova funcionalidade"

# Push para main
git push origin main
```

### 3. Deploy Automático

O deploy é executado automaticamente quando:
- ✅ Push é feito para branch `main`
- ✅ Todos os testes passam
- ✅ Documentação é validada
- ✅ Build é bem-sucedido

## Deploy Manual

Para deploy manual:

```bash
# Preparar para deploy
npm run deploy:prepare

# Deploy para produção
npm run deploy:prod

# Rollback se necessário
npm run deploy:rollback
```

## Scripts Disponíveis

### Desenvolvimento
- `npm run start:dev` - Desenvolvimento com hot reload
- `npm run test` - Testes unitários
- `npm run test:e2e` - Testes e2e
- `npm run lint` - Linting

### Documentação
- `npm run docs:generate` - Gerar documentação
- `npm run docs:validate` - Validar documentação
- `npm run docs:serve` - Servir documentação localmente
- `npm run docs:watch` - Monitorar mudanças

### Deploy
- `npm run deploy:prepare` - Preparar para deploy
- `npm run deploy:prod` - Deploy para produção
- `npm run deploy:rollback` - Rollback

## Estrutura de Deploy

```
Deploy Automático
├── GitHub Actions
│   ├── Checkout code
│   ├── Setup Node.js
│   ├── Install dependencies
│   ├── Run tests
│   ├── Build project
│   ├── Generate documentation
│   ├── Validate documentation
│   └── Deploy to production
└── Validações
    ├── Pré-deploy
    ├── Durante deploy
    └── Pós-deploy
```

## Monitoramento

### Health Check
- **URL**: `https://api.gwan.com.br/health`
- **Status**: `200 OK` com `{"status": "ok"}`

### Documentação
- **Swagger UI**: `https://api.gwan.com.br/api`
- **MCP Server**: `https://api.gwan.com.br/mcp`

### Logs
- **Deploy**: `deploy.log`
- **Aplicação**: Logs estruturados do NestJS

## Troubleshooting

### Deploy Falha
1. Verificar logs do GitHub Actions
2. Executar testes localmente
3. Corrigir problemas
4. Fazer novo commit e push

### Rollback
1. Identificar commit anterior
2. Reverter para commit anterior
3. Force push (cuidado!)
4. Deploy automático será executado

## Configurações

### Variáveis de Ambiente
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@prod-db:5432/gwan_events
JWT_SECRET=super-secret-jwt-key-production
MCP_BASE_URL=https://api.gwan.com.br
MCP_AUTH_TOKEN=production-mcp-token
```

### Secrets do GitHub
- `DATABASE_URL`
- `JWT_SECRET`
- `MCP_AUTH_TOKEN`
- `DEPLOY_TOKEN`

## Próximos Passos

1. [Documentação Completa](./docs/README.md)
2. [Deploy Automático](./docs/deployment/deploy-automation.md)
3. [Configuração de Ambiente](./docs/deployment/environment.md)
4. [Monitoramento](./docs/deployment/monitoring.md)

---

**🎉 Deploy automático configurado e funcionando!**
