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
# Tentar build e capturar qualquer erro
RUN set -e && \
    echo "=== Iniciando build ===" && \
    npm run build 2>&1 | head -100 || \
    (echo "=== ERRO NO BUILD - Tentando novamente com verbose ===" && \
     npx nest build 2>&1 || \
     (echo "=== ERRO PERSISTENTE - Verificando tipo de erro ===" && \
      npx tsc --noEmit 2>&1 | head -50 || true && \
      echo "=== Listando node_modules/@solufy ===" && \
      ls -la node_modules/@solufy/ 2>&1 || true && \
      echo "=== Verificando package.json ===" && \
      cat package.json | grep -A 2 "evolution-sdk" || true && \
      exit 1))

# Verificar se main.js foi gerado
RUN test -f dist/src/main.js || (echo "ERRO: dist/src/main.js nao encontrado!" && ls -la dist/ && ls -la dist/src/ 2>&1 && exit 1)

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
