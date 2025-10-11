# Dockerfile com Debug
FROM node:18-alpine

WORKDIR /app

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

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]

# Comando de inicialização
CMD ["node", "dist/main.js"]
