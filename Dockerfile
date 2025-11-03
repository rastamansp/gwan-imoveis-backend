# ========================================
# BUILD STAGE
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema para build
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci && npm cache clean --force && \
    echo "Dependências instaladas. Verificando NestJS CLI..." && \
    npx nest --version

# Copiar código-fonte (ignorar apenas o que está no .dockerignore)
COPY . .

# Verificar estrutura de diretórios importantes
RUN echo "Verificando estrutura de diretórios..." && \
    test -d src/whatsapp-webhook && echo "✓ src/whatsapp-webhook existe" || (echo "✗ src/whatsapp-webhook NÃO encontrado!" && exit 1) && \
    test -d src/whatsapp-webhook/services && echo "✓ src/whatsapp-webhook/services existe" || (echo "✗ src/whatsapp-webhook/services NÃO encontrado!" && exit 1) && \
    test -f src/whatsapp-webhook/services/evolution-api.service.ts && echo "✓ evolution-api.service.ts existe" || (echo "✗ evolution-api.service.ts NÃO encontrado!" && exit 1)

# Compilar TypeScript para JavaScript
RUN echo "=== Verificando Node e NPM ===" && \
    node --version && \
    npm --version && \
    echo "=== Verificando NestJS CLI ===" && \
    npx nest --version && \
    echo "=== Listando arquivos do whatsapp-webhook ===" && \
    ls -la src/whatsapp-webhook/ && \
    ls -la src/whatsapp-webhook/services/ && \
    echo "=== Verificando imports no controller ===" && \
    head -10 src/whatsapp-webhook/whatsapp-webhook.controller.ts && \
    echo "=== Iniciando build ===" && \
    npm run build || \
    (echo "=== FALHA NO BUILD - Mostrando estrutura ===" && \
     find src/whatsapp-webhook -type f && \
     cat src/whatsapp-webhook/whatsapp-webhook.module.ts && \
     exit 1)

# ========================================
# PRODUCTION STAGE
# ========================================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar dependências do sistema (wget e netcat para health check)
RUN apk add --no-cache wget netcat-openbsd

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção + devDependencies necessárias para MCP
RUN npm ci --only=production && \
    npm install --save-dev ts-node typescript @types/node && \
    npm cache clean --force

# Copiar código buildado do stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copiar toda a estrutura src/ para MCP poder executar (bootstrap precisa de toda a estrutura)
COPY --from=builder --chown=nestjs:nodejs /app/src ./src
COPY --from=builder --chown=nestjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nestjs:nodejs /app/nest-cli.json ./nest-cli.json

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização (sem migrations por enquanto)
CMD ["node", "dist/src/main.js"]
