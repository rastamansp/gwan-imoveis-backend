# MCP – Guia de Integração

Este guia ensina como conectar um cliente MCP ao servidor MCP deste projeto e consumir as APIs expostas como tools.

## Pré‑requisitos

- Node.js 18+
- Dependências instaladas: `npm install`
- API NestJS acessível no `MCP_BASE_URL` (por padrão `http://localhost:3001`)
- Variáveis de ambiente (defina conforme necessário):

```env
# URL base da API NestJS consumida pelos tools
MCP_BASE_URL=http://localhost:3001

# Token opcional do servidor MCP; se definido, os tools exigirão auth
# Utilize um segredo próprio para execuções reais
MCP_AUTH_TOKEN=seu-token-secreto-aqui
```

## Iniciar o servidor MCP (stdio)

Use os scripts já disponíveis no projeto:

```bash
npm run start:mcp:stdio
```

Isso inicia um servidor MCP via stdio que converte endpoints anotados com `@ApiExtension('x-mcp', { enabled: true })` em tools MCP.

Dica: se você atualizar anotações `x-mcp`, reinicie o servidor MCP para recarregar os tools.

## Conectando clientes MCP

### Claude Desktop

Edite o arquivo de configurações do Claude Desktop para registrar o servidor:

```json
{
  "mcpServers": {
    "gwan-events": {
      "command": "npm",
      "args": ["run", "start:mcp:stdio"],
      "cwd": "/caminho/para/gwan-events-backend",
      "env": {
        "MCP_BASE_URL": "http://localhost:3001",
        "MCP_AUTH_TOKEN": "seu-token-secreto-aqui"
      }
    }
  }
}
```

Ajuste `cwd` para o caminho local do repositório. Se não quiser autenticação, remova `MCP_AUTH_TOKEN`.

### VS Code (extensão MCP)

No `settings.json` do VS Code:

```json
{
  "mcp.servers": {
    "gwan-events": {
      "command": "npm",
      "args": ["run", "start:mcp:stdio"],
      "cwd": "/caminho/para/gwan-events-backend",
      "env": {
        "MCP_BASE_URL": "http://localhost:3001",
        "MCP_AUTH_TOKEN": "seu-token-secreto-aqui"
      }
    }
  }
}
```

### Chamada genérica via stdio (JSON‑RPC)

- Bash/macOS/Linux:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npm run -s start:mcp:stdio
```

- PowerShell (Windows):

```powershell
$payload = '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
$payload | npm run -s start:mcp:stdio
```

## Autenticação

- Se `MCP_AUTH_TOKEN` não estiver definido: os tools não exigem autenticação.
- Se `MCP_AUTH_TOKEN` estiver definido: envie o token nos argumentos do tool, no campo `authToken` (ou `_authToken`, ambos são aceitos), por exemplo:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_events",
    "arguments": {
      "city": "São Paulo",
      "authToken": "seu-token-secreto-aqui"
    }
  }
}
```

## Descoberta e chamada de tools

### Listar tools disponíveis

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Exemplos de execução

- list_events

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "list_events",
    "arguments": {
      "category": "Música",
      "city": "São Paulo",
      "authToken": "seu-token-secreto-aqui"
    }
  }
}
```

- get_event_by_id

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_event_by_id",
    "arguments": {
      "id": "<eventId>",
      "authToken": "seu-token-secreto-aqui"
    }
  }
}
```

- get_event_ticket_categories

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "get_event_ticket_categories",
    "arguments": {
      "id": "<eventId>",
      "authToken": "seu-token-secreto-aqui"
    }
  }
}
```

Observação: Os tools acima já estão anotados nos controllers de eventos (`@ApiExtension('x-mcp', { enabled: true, toolName, description })`).

## Boas práticas e segurança

- Evite expor via MCP endpoints que dependem do JWT do usuário final (ex.: compras, perfil).
- Prefira operações de leitura e validação operacional, como `tickets/validate?code&apiKey`.
- Se precisar expor check‑in (`PUT /tickets/{id}/use`), use um token de serviço com permissão mínima, logs estruturados e idempotência.
- Defina `MCP_BASE_URL` por ambiente (dev/test/prod) e monitore timeouts.

## Troubleshooting

- "Authentication required":
  - Defina `MCP_AUTH_TOKEN` no servidor e envie `authToken` nos argumentos.
- "Tool not found":
  - Verifique se o endpoint está anotado com `x-mcp.enabled = true` e reinicie o servidor MCP.
- "Cannot connect to API":
  - Confirme `MCP_BASE_URL`, se a API está rodando e acessível.
- "Invalid input":
  - Revise os parâmetros requeridos do tool (path/query/body) conforme o Swagger.

## Referências

- Visão Geral MCP: `docs/mcp/overview.md`
- Código do servidor MCP: `src/mcp/*`
