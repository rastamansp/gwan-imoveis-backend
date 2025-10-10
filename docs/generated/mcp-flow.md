# Fluxo MCP

Diagrama gerado automaticamente em 2025-10-10T23:37:23.462Z

```mermaid
graph TB
    subgraph "MCP Clients"
        CLAUDE[Claude Desktop]
        VSCODE[VS Code Extension]
        OTHER[Other MCP Clients]
    end
    
    subgraph "MCP Server"
        STDIO[Stdio Transport]
        SSE[SSE Transport]
        SERVER[MCP Server Core]
    end
    
    subgraph "Tool Processing"
        CONVERTER[OpenAPI Converter]
        HANDLER[HTTP Handler]
        AUTH[Auth Middleware]
    end
    
    subgraph "Backend Services"
        NESTJS[NestJS API]
        SWAGGER[Swagger/OpenAPI]
        DB[(Database)]
    end
    
    CLAUDE --> STDIO
    VSCODE --> SSE
    OTHER --> STDIO
    
    STDIO --> SERVER
    SSE --> SERVER
    
    SERVER --> CONVERTER
    CONVERTER --> SWAGGER
    SERVER --> HANDLER
    HANDLER --> AUTH
    AUTH --> NESTJS
    
    NESTJS --> SWAGGER
    NESTJS --> DB
```

## Descrição

Este diagrama foi gerado automaticamente a partir da análise do código fonte.

## Como usar

1. Copie o código Mermaid acima
2. Cole em um editor que suporte Mermaid (GitHub, GitLab, etc.)
3. O diagrama será renderizado automaticamente

## Atualização

Este diagrama é atualizado automaticamente quando o código fonte é modificado.
