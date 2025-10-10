# MCP Server - Gwan Events Backend

Este projeto implementa um servidor MCP (Model Context Protocol) que expõe as APIs do NestJS como tools para clientes MCP.

## 🚀 Funcionalidades

- **3 Tools MCP disponíveis:**
  - `list_events` - Lista todos os eventos disponíveis
  - `get_event_by_id` - Obter detalhes de um evento específico
  - `get_event_ticket_categories` - Listar categorias de ingressos de um evento

## 📋 Pré-requisitos

- Node.js v20+
- Servidor NestJS rodando na porta 3001
- Dependências instaladas: `@modelcontextprotocol/sdk`, `undici`

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# MCP Server Configuration
MCP_BASE_URL=http://localhost:3001
MCP_PORT_SSE=3002
MCP_AUTH_TOKEN=  # Opcional para autenticação
```

## 🚀 Como Usar

### 1. Iniciar o Servidor NestJS

```bash
npm run start:dev
```

### 2. Iniciar o Servidor MCP (stdio)

```bash
npm run start:mcp:stdio
```

### 3. Testar os Tools

#### Listar eventos:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_events", "arguments": {}}}' | npm run start:mcp:stdio
```

#### Obter evento por ID:
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_event_by_id", "arguments": {"id": "1"}}}' | npm run start:mcp:stdio
```

#### Listar categorias de ingressos:
```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_event_ticket_categories", "arguments": {"id": "1"}}}' | npm run start:mcp:stdio
```

## 🔌 Integração com Clientes MCP

### Claude Desktop

Adicione ao arquivo de configuração do Claude Desktop:

**Sem autenticação:**
```json
{
  "mcpServers": {
    "gwan-events": {
      "command": "npm",
      "args": ["run", "start:mcp:stdio"],
      "cwd": "/caminho/para/gwan-events-backend"
    }
  }
}
```

**Com autenticação:**
```json
{
  "mcpServers": {
    "gwan-events": {
      "command": "npm",
      "args": ["run", "start:mcp:stdio"],
      "cwd": "/caminho/para/gwan-events-backend",
      "env": {
        "MCP_AUTH_TOKEN": "seu-token-secreto-aqui"
      }
    }
  }
}
```

**Nota:** Quando usar autenticação, você precisará fornecer o token em cada chamada de tool via `_authToken` parameter.

### Outros Clientes MCP

O servidor MCP expõe os seguintes endpoints:

- **Listar tools:** `tools/list`
- **Executar tool:** `tools/call`

## 📁 Estrutura do Projeto

```
src/mcp/
├── bootstrap-mcp.ts           # Bootstrap sem servidor HTTP
├── server-stdio.ts           # Servidor MCP stdio
├── server-sse.ts             # Servidor MCP SSE (via stdio)
├── converters/
│   └── openapi-to-mcp.ts     # Conversor OpenAPI → Tools
├── handlers/
│   └── http-tool-handler.ts  # Executor de chamadas HTTP
└── types/
    └── mcp-types.ts          # Types customizados
```

## 🛠️ Desenvolvimento

### Adicionar Novos Tools

1. Marque o endpoint no controller com `@ApiExtension('x-mcp', {...})`
2. Reinicie o servidor MCP
3. O tool será automaticamente disponibilizado

### Exemplo:

```typescript
@Get(':id/tickets')
@ApiExtension('x-mcp', {
  enabled: true,
  toolName: 'get_event_tickets',
  description: 'Listar ingressos de um evento específico.',
})
async getEventTickets(@Param('id') id: string) {
  // implementação
}
```

## 🐛 Troubleshooting

### Erro: "address already in use"
- Verifique se o servidor NestJS está rodando na porta 3001
- Encerre processos Node.js conflitantes: `taskkill /F /IM node.exe`

### Erro: "Cannot find module"
- Execute `npm install` para instalar dependências
- Verifique se o TypeScript está compilando corretamente

### Tools não aparecem
- Verifique se o endpoint está marcado com `@ApiExtension('x-mcp', {enabled: true})`
- Confirme se o servidor NestJS está rodando

## 📝 Logs

O servidor MCP usa `console.error` para logs de inicialização e `console.log` para respostas JSON-RPC.

## 🔒 Segurança

- O servidor MCP não expõe endpoints por padrão
- Apenas endpoints marcados com `x-mcp.enabled = true` são expostos
- **Autenticação obrigatória** via `MCP_AUTH_TOKEN` quando configurado

### Autenticação

O servidor MCP suporta autenticação via token para maior segurança:

#### Configuração

```env
# No arquivo .env
MCP_AUTH_TOKEN=seu-token-secreto-aqui
```

#### Uso

Quando `MCP_AUTH_TOKEN` está configurado, todos os tools requerem autenticação:

```bash
# Sem token (falha se autenticação estiver habilitada)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "list_events", "arguments": {}}}' | npm run start:mcp:stdio

# Com token correto (sucesso)
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "list_events", "arguments": {"_authToken": "seu-token-secreto-aqui"}}}' | npm run start:mcp:stdio
```

#### Parâmetros de Autenticação

- `_authToken` - Token de autenticação (recomendado)
- `authToken` - Token de autenticação (alternativo)

#### Comportamento

- **Sem `MCP_AUTH_TOKEN`**: Autenticação desabilitada, todos os tools funcionam sem token
- **Com `MCP_AUTH_TOKEN`**: Autenticação obrigatória, todos os tools requerem token válido
- **Token inválido**: Retorna erro `Authentication required`
- **Token correto**: Executa o tool normalmente

#### Segurança

- Comparação segura de tokens (proteção contra timing attacks)
- Tokens não são logados ou expostos
- Validação em cada chamada de tool

## 📚 Recursos Adicionais

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Claude Desktop MCP](https://claude.ai/desktop)
