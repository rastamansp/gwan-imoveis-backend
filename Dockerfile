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
RUN npm ci && npm cache clean --force

# Copiar código-fonte
COPY . .

# Compilar TypeScript para JavaScript
RUN npm run build

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

# Copiar arquivos TypeScript necessários para MCP (antes de mudar usuário)
COPY --from=builder --chown=nestjs:nodejs /app/src/mcp ./src/mcp
COPY --from=builder --chown=nestjs:nodejs /app/tsconfig.json ./tsconfig.json

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização (sem migrations por enquanto)
CMD ["node", "dist/src/main.js"]
