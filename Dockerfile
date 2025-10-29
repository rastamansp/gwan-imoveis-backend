# Dockerfile para Produção
FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache wget netcat-openbsd

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo dev para build)
RUN npm ci && npm cache clean --force

# Copiar código-fonte
COPY . .

# Compilar TypeScript para JavaScript
RUN npm run build

# Remover dependências de desenvolvimento após build
RUN npm prune --production

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Comando de inicialização (sem migrations por enquanto)
CMD ["node", "dist/main.js"]
