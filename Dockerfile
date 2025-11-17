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
RUN test -d src/whatsapp-webhook && \
    test -d src/whatsapp-webhook/services && \
    test -f src/whatsapp-webhook/services/evolution-api.service.ts || \
    (echo "ERRO: Estrutura de diretorios do whatsapp-webhook nao encontrada!" && exit 1)

# Verificar se o SDK está instalado
RUN echo "=== Verificando pacote @solufy/evolution-sdk ===" && \
    npm list @solufy/evolution-sdk || echo "AVISO: SDK nao encontrado nas dependencias instaladas"

# Compilar TypeScript para JavaScript
RUN echo "=== Iniciando build ===" && npm run build || (echo "ERRO: Build falhou!" && exit 1)

# Verificar estrutura gerada pelo build
RUN echo "=== Verificando estrutura dist/ ===" && \
    ls -la dist/ 2>&1 && \
    echo "=== Verificando estrutura dist/src/ ===" && \
    ls -la dist/src/ 2>&1 || echo "AVISO: dist/src/ nao existe" && \
    echo "=== Procurando main.js em toda estrutura ===" && \
    find dist -name "main.js" -type f 2>&1 && \
    echo "=== Verificando se existe dist/main.js (sem src/) ===" && \
    test -f dist/main.js && echo "dist/main.js EXISTE!" || echo "dist/main.js nao existe" && \
    echo "=== Verificando se existe dist/src/main.js ===" && \
    test -f dist/src/main.js && echo "dist/src/main.js EXISTE!" || echo "dist/src/main.js nao existe"

# Verificar se main.js, app.module.js e arquivos de configuração foram gerados
RUN if [ -f dist/src/main.js ]; then \
      echo "=== main.js encontrado em dist/src/main.js ===" && \
      ls -lh dist/src/main.js && \
      test -f dist/src/app.module.js || (echo "ERRO: app.module.js nao encontrado!" && find dist -name "app.module.js" 2>&1 && exit 1) && \
      echo "=== app.module.js encontrado ===" && \
      ls -lh dist/src/app.module.js && \
      test -f dist/src/config/typeorm.config.js || (echo "ERRO: typeorm.config.js nao encontrado!" && find dist -name "typeorm.config.js" 2>&1 && exit 1) && \
      echo "=== typeorm.config.js encontrado ===" && \
      ls -lh dist/src/config/typeorm.config.js && \
      echo "=== Verificando estrutura de config/ ===" && \
      ls -la dist/src/config/ 2>&1 || echo "AVISO: config/ nao existe"; \
    elif [ -f dist/main.js ]; then \
      echo "=== AVISO: main.js encontrado em dist/main.js (sem src/) ===" && \
      ls -lh dist/main.js && \
      echo "=== Criando estrutura dist/src/ ===" && \
      mkdir -p dist/src && \
      cp dist/main.js dist/src/main.js && \
      test -f dist/app.module.js && cp dist/app.module.js dist/src/app.module.js || (echo "ERRO: app.module.js nao encontrado!" && exit 1) && \
      mkdir -p dist/src/config && \
      test -f dist/config/typeorm.config.js && cp dist/config/typeorm.config.js dist/src/config/typeorm.config.js || (echo "ERRO: typeorm.config.js nao encontrado!" && exit 1) && \
      echo "=== Arquivos copiados para dist/src/ ==="; \
    else \
      echo "=== ERRO: main.js nao encontrado em nenhum lugar ===" && \
      echo "=== Listando estrutura completa de dist/ ===" && \
      find dist -type f 2>&1 | head -30 && \
      exit 1; \
    fi

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

# Verificar se main.js foi copiado corretamente
RUN echo "=== Verificando arquivos copiados ===" && \
    test -f dist/src/main.js || (echo "ERRO: dist/src/main.js nao encontrado apos copia!" && ls -la dist/ && ls -la dist/src/ 2>&1 && exit 1) && \
    echo "=== Arquivos copiados com sucesso ==="

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
