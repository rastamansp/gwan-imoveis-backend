# Application Communication Diagram

## Visão Geral

Este documento apresenta o **diagrama de comunicação entre aplicações**, mostrando como as diferentes aplicações e serviços se comunicam na plataforma Litoral Imóveis.

## Diagrama de Comunicação Principal

```mermaid
graph TB
    subgraph "External Systems"
        CLIENT[Client<br/>Web/Mobile]
        OPENAI[OpenAI API]
        EVOLUTION[Evolution API<br/>WhatsApp]
        MINIO[MinIO<br/>Storage]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
    end
    
    subgraph "Backend API"
        API[Backend API<br/>REST]
    end
    
    subgraph "Chat Service"
        CHAT[Chat Service]
    end
    
    subgraph "MCP Server"
        MCP[MCP Server]
    end
    
    subgraph "WhatsApp Service"
        WHATSAPP[WhatsApp Webhook]
    end
    
    CLIENT -->|HTTP/REST| API
    CLIENT -->|HTTP/REST| CHAT
    
    CHAT -->|HTTP/REST| MCP
    CHAT -->|HTTP/REST| OPENAI
    MCP -->|HTTP/REST| API
    
    EVOLUTION -->|Webhook HTTP| WHATSAPP
    WHATSAPP -->|HTTP/REST| CHAT
    WHATSAPP -->|SDK| EVOLUTION
    
    API -->|SQL| POSTGRES
    API -->|Redis Protocol| REDIS
    API -->|S3 API| MINIO
```

## Padrões de Comunicação

### 1. Síncrona Request/Response

**Aplicações**: Backend API, Chat Service, MCP Server

**Protocolo**: HTTP/HTTPS REST

**Exemplo**: Cliente → Backend API → Database → Backend API → Cliente

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Backend API
    participant DB as Database
    
    C->>API: GET /api/properties
    API->>DB: SELECT * FROM properties
    DB-->>API: Results
    API-->>C: JSON Response
```

### 2. Assíncrona Event-Driven

**Aplicações**: WhatsApp Webhook

**Protocolo**: HTTP Webhook

**Exemplo**: Evolution API → WhatsApp Webhook → Chat Service → Evolution API

```mermaid
sequenceDiagram
    participant EVO as Evolution API
    participant WEBHOOK as WhatsApp Webhook
    participant CHAT as Chat Service
    participant MCP as MCP Server
    participant API as Backend API
    
    EVO->>WEBHOOK: POST /api/whatsapp-webhook
    WEBHOOK->>CHAT: Process Message
    CHAT->>MCP: Call Tool
    MCP->>API: GET /api/properties
    API-->>MCP: Properties
    MCP-->>CHAT: Tool Result
    CHAT-->>WEBHOOK: Formatted Response
    WEBHOOK->>EVO: Send Message (SDK)
```

### 3. Streaming (Server-Sent Events)

**Aplicações**: MCP Server SSE

**Protocolo**: HTTP SSE

**Exemplo**: Cliente MCP → MCP Server SSE → Stream de eventos

```mermaid
sequenceDiagram
    participant CLIENT as MCP Client
    participant MCP as MCP Server SSE
    
    CLIENT->>MCP: GET /api/mcp/sse
    MCP-->>CLIENT: Stream: tools/list
    CLIENT->>MCP: tools/call
    MCP-->>CLIENT: Stream: Result
```

### 4. Standard I/O

**Aplicações**: MCP Server STDIO

**Protocolo**: STDIN/STDOUT

**Exemplo**: Processo MCP → STDIO → Agente de IA

## Fluxos de Comunicação Detalhados

### Fluxo: Busca de Imóveis via Chat

```mermaid
sequenceDiagram
    participant USER as Usuário
    participant CHAT as Chat Service
    participant OPENAI as OpenAI
    participant MCP as MCP Server
    participant API as Backend API
    participant DB as Database
    
    USER->>CHAT: "Liste imóveis em São Sebastião"
    CHAT->>OPENAI: Send message + tools
    OPENAI->>OPENAI: Decide usar list_properties
    OPENAI->>MCP: Call list_properties(city="São Sebastião")
    MCP->>API: GET /api/properties?city=São Sebastião
    API->>DB: Query properties
    DB-->>API: Properties data
    API-->>MCP: JSON response
    MCP-->>OPENAI: Tool result
    OPENAI->>OPENAI: Format response
    OPENAI-->>CHAT: Formatted answer
    CHAT-->>USER: "Encontrei X imóveis..."
```

### Fluxo: Upload de Imagem de Imóvel

```mermaid
sequenceDiagram
    participant CLIENT as Cliente
    participant API as Backend API
    participant STORAGE as Storage Service
    participant MINIO as MinIO
    participant DB as Database
    
    CLIENT->>API: POST /api/properties/:id/images
    API->>API: Validate file
    API->>STORAGE: Upload image
    STORAGE->>STORAGE: Process image (Sharp)
    STORAGE->>MINIO: Upload original
    STORAGE->>MINIO: Upload thumbnail
    MINIO-->>STORAGE: URLs
    STORAGE-->>API: Image URLs
    API->>DB: Save PropertyImage
    DB-->>API: Saved entity
    API-->>CLIENT: Image response
```

### Fluxo: Atendimento via WhatsApp

```mermaid
sequenceDiagram
    participant USER as Usuário WhatsApp
    participant EVO as Evolution API
    participant WEBHOOK as WhatsApp Webhook
    participant CHAT as Chat Service
    participant MCP as MCP Server
    participant API as Backend API
    
    USER->>EVO: Envia mensagem
    EVO->>WEBHOOK: Webhook event
    WEBHOOK->>WEBHOOK: Check if user exists
    WEBHOOK->>WEBHOOK: Register if needed
    WEBHOOK->>CHAT: Process message
    CHAT->>MCP: Call tool if needed
    MCP->>API: Get data
    API-->>MCP: Data
    MCP-->>CHAT: Tool result
    CHAT-->>WEBHOOK: Formatted response
    WEBHOOK->>EVO: Send message (SDK)
    EVO->>USER: Mensagem no WhatsApp
```

## Matriz de Comunicação

| Origem | Destino | Protocolo | Autenticação | Frequência |
|--------|---------|-----------|--------------|------------|
| Client | Backend API | HTTP REST | JWT (quando necessário) | Alta |
| Client | Chat Service | HTTP REST | Opcional | Média |
| Chat Service | MCP Server | HTTP REST | Token (opcional) | Alta |
| Chat Service | OpenAI | HTTP REST | API Key | Alta |
| MCP Server | Backend API | HTTP REST | JWT (quando necessário) | Alta |
| WhatsApp Webhook | Chat Service | Internal | - | Média |
| Evolution API | WhatsApp Webhook | HTTP Webhook | Validação origem | Média |
| WhatsApp Webhook | Evolution API | HTTP SDK | API Key | Média |
| Backend API | PostgreSQL | SQL | Credenciais | Muito Alta |
| Backend API | Redis | Redis Protocol | Credenciais | Média |
| Backend API | MinIO | S3 API | Access/Secret Key | Baixa |

## Padrões de Integração

### 1. API Gateway Pattern (Futuro)
- Traefik atua como reverse proxy
- Roteamento baseado em host
- SSL/TLS termination
- Load balancing

### 2. Service-to-Service Communication
- Comunicação direta via HTTP
- Autenticação via JWT ou tokens
- Timeout e retry policies

### 3. Event-Driven Architecture (Futuro)
- Message queues para eventos assíncronos
- Pub/Sub para notificações
- Event sourcing para auditoria

## Segurança na Comunicação

### Comunicação Externa
- **HTTPS**: Todas as comunicações externas usam HTTPS
- **JWT**: Autenticação para APIs protegidas
- **API Keys**: Para serviços externos (OpenAI, Evolution API)

### Comunicação Interna
- **Network Isolation**: Serviços em mesma rede Docker
- **Service Mesh** (Futuro): mTLS entre serviços

## Monitoramento de Comunicação

### Métricas
- Latência de requisições
- Taxa de erro
- Throughput
- Disponibilidade de serviços

### Logs
- Todas as requisições HTTP logadas
- Erros de comunicação registrados
- Traces de requisições (futuro)

## Próximas Melhorias

- [ ] Implementar circuit breaker para resiliência
- [ ] Adicionar retry policies
- [ ] Implementar service mesh
- [ ] Adicionar message queue para eventos
- [ ] Implementar API Gateway completo
- [ ] Adicionar rate limiting
- [ ] Implementar caching distribuído

