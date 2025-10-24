# Dockerfile com Debug
FROM node:18-alpine

WORKDIR /app

# Instalar wget para health check
RUN apk add --no-cache wget

# Debug: mostrar versão do npm
RUN npm --version

# Debug: mostrar conteúdo do diretório
RUN ls -la

# Copiar package.json primeiro
COPY package.json ./

# Debug: mostrar conteúdo do package.json
RUN cat package.json

# Instalar dependências com verbose
RUN npm install --verbose

# Copiar resto dos arquivos
COPY . .

# Debug: mostrar estrutura de arquivos
RUN ls -la

# Build da aplicação
RUN npm run build

# Executar migrations
RUN npm run typeorm:migration:run

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["node", "dist/main.js"]
