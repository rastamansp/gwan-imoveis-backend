# 📚 Documentação Automática

## Visão Geral

O sistema de documentação automática do Gwan Events Backend gera e mantém a documentação atualizada automaticamente, incluindo:

- **Documentação de APIs** baseada no código fonte
- **Diagramas Mermaid** gerados automaticamente
- **Validação** de consistência e qualidade
- **Monitoramento** de mudanças em tempo real
- **Servidor local** para visualização

## Scripts Disponíveis

### Geração de Documentação

```bash
# Gerar toda a documentação
npm run docs:generate

# Gerar apenas documentação de APIs
node scripts/generate-api-docs.js

# Gerar apenas diagramas Mermaid
node scripts/generate-mermaid-diagrams.js

# Gerar documentação geral
node scripts/generate-docs.js
```

### Validação

```bash
# Validar documentação existente
npm run docs:validate

# Validar com script direto
node scripts/validate-docs.js
```

### Servidor Local

```bash
# Servir documentação localmente
npm run docs:serve

# Servir em porta específica
DOCS_PORT=3000 npm run docs:serve
```

### Monitoramento

```bash
# Monitorar mudanças e regenerar automaticamente
npm run docs:watch

# Limpar arquivos gerados
npm run docs:clean
```

### Ajuda

```bash
# Mostrar ajuda
npm run docs:help
```

## Estrutura de Arquivos

```
docs/
├── README.md                 # Índice principal
├── architecture/             # Documentação de arquitetura
├── development/              # Guias de desenvolvimento
├── api/                      # Documentação de APIs
├── mcp/                      # Documentação MCP
├── deployment/               # Guias de deploy
├── diagrams/                 # Diagramas Mermaid
└── generated/                # Arquivos gerados automaticamente
    ├── api-*.md              # Documentação de APIs por módulo
    ├── *-generated.md        # Documentação geral
    ├── *.md                  # Diagramas Mermaid
    └── cache/                # Cache de geração
```

## Configuração

### Arquivo de Configuração

O arquivo `docs.config.js` contém todas as configurações:

```javascript
module.exports = {
  title: 'Gwan Events Backend',
  api: {
    baseUrl: 'http://localhost:3001',
    swaggerPath: '/api-json'
  },
  paths: {
    src: './src',
    docs: './docs',
    generated: './docs/generated'
  },
  // ... outras configurações
};
```

### Variáveis de Ambiente

```env
# URL base da API
API_BASE_URL=http://localhost:3001

# Porta para servir documentação
DOCS_PORT=8080

# Nível de log
LOG_LEVEL=info
```

## Geradores Disponíveis

### 1. Gerador de APIs

**Arquivo:** `scripts/generate-api-docs.js`

**Funcionalidades:**
- Busca especificação OpenAPI do servidor
- Gera documentação por módulo
- Cria exemplos de uso
- Extrai schemas e tipos

**Uso:**
```bash
node scripts/generate-api-docs.js
```

**Saída:**
- `docs/generated/api-{module}.md` - Documentação por módulo
- `docs/generated/api-complete.md` - Documentação completa
- `docs/generated/api-examples.md` - Exemplos de uso

### 2. Gerador de Diagramas Mermaid

**Arquivo:** `scripts/generate-mermaid-diagrams.js`

**Funcionalidades:**
- Analisa estrutura do código
- Gera diagramas de arquitetura
- Cria diagramas de fluxo de dados
- Gera schema do banco de dados

**Uso:**
```bash
node scripts/generate-mermaid-diagrams.js
```

**Saída:**
- `docs/generated/system-architecture.md` - Arquitetura do sistema
- `docs/generated/data-flow.md` - Fluxo de dados
- `docs/generated/module-dependencies.md` - Dependências entre módulos
- `docs/generated/api-flow.md` - Fluxo da API
- `docs/generated/database-schema.md` - Schema do banco
- `docs/generated/mcp-flow.md` - Fluxo MCP

### 3. Gerador Geral

**Arquivo:** `scripts/generate-docs.js`

**Funcionalidades:**
- Analisa controllers e serviços
- Extrai endpoints e métodos
- Gera documentação de módulos
- Cria índices automáticos

**Uso:**
```bash
node scripts/generate-docs.js
```

**Saída:**
- `docs/generated/api-generated.md` - APIs encontradas
- `docs/generated/modules-generated.md` - Módulos do sistema

## Validador de Documentação

### Funcionalidades

- **Estrutura de arquivos** - Verifica arquivos obrigatórios
- **Conteúdo Markdown** - Valida sintaxe e estrutura
- **Diagramas Mermaid** - Verifica sintaxe e consistência
- **Links** - Detecta links quebrados
- **Consistência** - Verifica referências cruzadas

### Uso

```bash
# Validação completa
npm run docs:validate

# Validação com script direto
node scripts/validate-docs.js
```

### Exemplo de Saída

```
🔍 Validando documentação...

📁 Validando estrutura de arquivos...
📝 Validando conteúdo Markdown...
📊 Validando diagramas Mermaid...
🔗 Validando links...
🔄 Validando consistência...

📋 Resultados da Validação:
============================

✅ Documentação válida! Nenhum problema encontrado.
```

## Monitoramento em Tempo Real

### Funcionalidades

- **Watch de arquivos** - Monitora mudanças no código
- **Regeneração automática** - Atualiza documentação automaticamente
- **Debounce** - Evita regeneração excessiva
- **Logs detalhados** - Mostra o que foi alterado

### Uso

```bash
# Iniciar monitoramento
npm run docs:watch

# Monitorar com configuração personalizada
node scripts/docs-manager.js watch
```

### Exemplo de Saída

```
👀 Monitorando mudanças...
✅ Monitoramento ativo. Pressione Ctrl+C para parar.

📝 Arquivo alterado: src/events/events.controller.ts
🔄 Regenerando documentação...
📡 Gerando documentação de APIs...
📊 Gerando diagramas Mermaid...
📚 Gerando documentação geral...
🔍 Validando documentação...
✅ Documentação regenerada com sucesso!
```

## Servidor Local

### Funcionalidades

- **Servidor HTTP** - Serve arquivos estáticos
- **Abertura automática** - Abre no navegador
- **CORS habilitado** - Permite acesso cross-origin
- **Verificação de servidor** - Confirma se API está rodando

### Uso

```bash
# Servir documentação
npm run docs:serve

# Servir em porta específica
DOCS_PORT=3000 npm run docs:serve
```

### Exemplo de Saída

```
🌐 Servindo documentação localmente...
📖 Documentação disponível em: http://localhost:8080
📁 Servindo arquivos de: ./docs
```

## Integração com CI/CD

### GitHub Actions

```yaml
name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start API server
        run: npm run start:dev &
        
      - name: Wait for server
        run: sleep 10
        
      - name: Generate documentation
        run: npm run docs:generate
        
      - name: Validate documentation
        run: npm run docs:validate
        
      - name: Upload documentation
        uses: actions/upload-artifact@v3
        with:
          name: documentation
          path: docs/generated/
```

### GitLab CI

```yaml
generate_docs:
  stage: build
  image: node:20
  
  before_script:
    - npm ci
    - npm run start:dev &
    - sleep 10
    
  script:
    - npm run docs:generate
    - npm run docs:validate
    
  artifacts:
    paths:
      - docs/generated/
    expire_in: 1 week
```

## Troubleshooting

### Problemas Comuns

#### Erro: "API server not running"
```bash
# Solução: Iniciar servidor da API
npm run start:dev

# Em outro terminal, gerar documentação
npm run docs:generate
```

#### Erro: "OpenAPI spec not found"
```bash
# Verificar se Swagger está configurado
curl http://localhost:3001/api-json

# Configurar Swagger no main.ts se necessário
```

#### Erro: "Mermaid diagram invalid"
```bash
# Verificar sintaxe Mermaid
# Usar validador online: https://mermaid.live/

# Corrigir sintaxe no diagrama
```

#### Erro: "Links broken"
```bash
# Validar links
npm run docs:validate

# Corrigir caminhos dos links
```

### Logs de Debug

```bash
# Habilitar logs detalhados
LOG_LEVEL=debug npm run docs:generate

# Ver logs em arquivo
tail -f docs/generated/logs/docs-generation.log
```

## Personalização

### Adicionar Novo Gerador

1. **Criar arquivo:** `scripts/generate-custom.js`
2. **Implementar classe:** `CustomGenerator`
3. **Adicionar script:** `"docs:custom": "node scripts/generate-custom.js"`
4. **Usar:** `npm run docs:custom`

### Adicionar Nova Validação

1. **Criar arquivo:** `scripts/validate-custom.js`
2. **Implementar classe:** `CustomValidator`
3. **Adicionar script:** `"docs:validate-custom": "node scripts/validate-custom.js"`
4. **Usar:** `npm run docs:validate-custom`

### Configurar Templates

1. **Editar:** `docs.config.js`
2. **Modificar:** `templates` section
3. **Reiniciar:** `npm run docs:generate`

## Próximos Passos

1. [Configuração](./setup.md) - Configuração do ambiente
2. [APIs](../api/overview.md) - Documentação das APIs
3. [Deploy](../deployment/deploy-automation.md) - Deploy automático
