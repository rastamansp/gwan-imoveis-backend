# Diagramas Mermaid - APIs e Fluxos

## Arquitetura do Sistema

```mermaid
graph TB
    subgraph "Frontend"
        WEB[Web App]
        MOBILE[Mobile App]
        CHAT[Chat Widget]
    end
    
    subgraph "Backend - NestJS"
        API[REST APIs]
        CHATAPI[Chat API]
        MCP[MCP Server]
        AUTH[Auth/Guards]
        
        subgraph "Módulos"
            EVENTS[Events Module]
            TICKETS[Tickets Module]
            USERS[Users Module]
            PAYMENTS[Payments Module]
            ADMIN[Admin Module]
        end
        
        subgraph "Shared"
            UC[Use Cases]
            REPO[Repositories]
            DTO[DTOs]
        end
    end
    
    subgraph "Infraestrutura"
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
        OPENAI[OpenAI API]
    end
    
    WEB --> API
    MOBILE --> API
    CHAT --> CHATAPI
    CHATAPI --> MCP
    CHATAPI --> OPENAI
    API --> AUTH
    API --> EVENTS
    API --> TICKETS
    API --> USERS
    API --> PAYMENTS
    API --> ADMIN
    
    EVENTS --> UC
    TICKETS --> UC
    USERS --> UC
    PAYMENTS --> UC
    
    UC --> REPO
    REPO --> PG
    AUTH --> PG
    
    UC --> REDIS
    MCP --> API
    
    style WEB fill:#e1f5e1
    style MOBILE fill:#e1f5e1
    style CHAT fill:#e1f5e1
    style API fill:#fff4e1
    style CHATAPI fill:#ffb5c8
    style MCP fill:#b5c8ff
    style EVENTS fill:#c8ffb5
    style TICKETS fill:#c8ffb5
    style USERS fill:#c8ffb5
    style PG fill:#ffe1e1
    style OPENAI fill:#e1ffff
```

## Fluxo de Chat com MCP

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Chat as ChatController
    participant Service as ChatService
    participant OpenAI as OpenAI API
    participant MCP as MCP Bridge
    participant API as REST APIs
    participant DB as PostgreSQL
    
    User->>Chat: POST /api/chat {message}
    
    Chat->>Service: processMessage(message, userCtx)
    
    Note over Service: 1. Normalizar mensagem
    Service->>Service: normalizeMessage()
    
    Note over Service: 2. Construir tools schema
    Service->>Service: buildToolsSchema()
    
    Note over Service: 3. Chamar OpenAI
    Service->>OpenAI: POST /v1/chat/completions
    activate OpenAI
    
    OpenAI-->>Service: tool_calls: ["search_events"]
    
    Note over Service: 4. Executar tool MCP
    Service->>MCP: callTool("search_events", {...})
    activate MCP
    
    MCP->>API: GET /api/events/search?query=...
    activate API
    
    API->>DB: SELECT ... WHERE ...
    activate DB
    DB-->>API: resultados
    deactivate DB
    
    API-->>MCP: eventos[]
    deactivate API
    
    MCP-->>Service: dados estruturados
    deactivate MCP
    
    Note over Service: 5. Enviar resultados ao OpenAI
    Service->>OpenAI: tool results
    OpenAI-->>Service: resposta final formatada
    
    deactivate OpenAI
    
    Service-->>Chat: {answer, toolsUsed}
    Chat-->>User: resposta final
    
    Note over User: Chatbot responde com dados reais
```

## Fluxo de Criação de Evento

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Controller as EventsController
    participant UseCase as CreateEventUseCase
    participant Repository as EventRepository
    participant Entity as Event Entity
    participant DB as PostgreSQL
    
    Client->>Controller: POST /api/events + token
    Note over Controller: JwtAuthGuard valida token
    
    Controller->>Controller: valida DTO
    Controller->>UseCase: execute({ eventData, userId })
    
    Note over UseCase: 1. Validar dados
    UseCase->>UseCase: validateEventData()
    
    Note over UseCase: 2. Criar entidade
    UseCase->>Entity: create({ title, date, ... })
    Entity->>Entity: gera código único
    Entity-->>UseCase: Event instance
    
    Note over UseCase: 3. Persistir
    UseCase->>Repository: save(event)
    Repository->>DB: INSERT INTO events
    DB-->>Repository: evento criado
    
    Repository-->>UseCase: Event (com ID)
    UseCase-->>Controller: EventResponseDto
    Controller-->>Client: 201 Created + dados
    
    Note over Client: Evento disponível na API
```

## Fluxo de Compra de Ingresso

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as Tickets API
    participant UseCase as PurchaseTicketUseCase
    participant Payment as PaymentService
    participant QR as QRCodeService
    participant DB as PostgreSQL
    participant Email as EmailService
    
    Client->>API: POST /api/tickets + token
    Note over API: JwtAuthGuard valida usuário
    
    API->>UseCase: execute({ eventId, categoryId, quantity, userId })
    
    Note over UseCase: 1. Validar disponibilidade
    UseCase->>UseCase: checkAvailability()
    
    Note over UseCase: 2. Validar crédito
    UseCase->>Payment: validatePayment()
    Payment-->>UseCase: approved
    
    Note over UseCase: 3. Criar tickets
    loop Para cada ingresso
        UseCase->>DB: INSERT INTO tickets
        UseCase->>QR: generateQRCode(ticketId)
        QR-->>UseCase: qrCodeData
    end
    
    Note over UseCase: 4. Criar pagamento
    UseCase->>Payment: createPayment()
    Payment->>DB: INSERT INTO payments
    
    Note over UseCase: 5. Notificar usuário
    UseCase->>Email: sendConfirmation()
    Email-->>UseCase: sent
    
    UseCase-->>API: TicketResponseDto[]
    API-->>Client: 201 Created + tickets + QR codes
    
    Note over Client: Usuário recebe ingressos por email
```

## APIs por Módulo - Resumo

```mermaid
graph LR
    subgraph "APIs Públicas"
        AUTH["🔐 Auth<br/>/api/auth/login<br/>/api/auth/register"]
        EVENTS["📅 Events<br/>/api/events<br/>GET/POST/PUT/DELETE"]
        SEARCH["🔍 Search<br/>/api/events/search"]
    end
    
    subgraph "APIs Autenticadas"
        TICKETS["🎫 Tickets<br/>/api/tickets<br/>+ validate/use/transfer"]
        PAYMENTS["💰 Payments<br/>/api/payments<br/>+ approve/reject/refund"]
        USERS["👥 Users<br/>/api/users"]
        ADMIN["📊 Admin<br/>/api/admin/dashboard"]
    end
    
    subgraph "APIs Especiais"
        CHAT["🤖 Chat<br/>/api/chat<br/>OpenAI + MCP"]
        MCP["🔌 MCP<br/>/api/mcp/tools<br/>Bridge HTTP"]
        HEALTH["❤️ Health<br/>/api/health"]
    end
    
    style AUTH fill:#fff4e1
    style EVENTS fill:#e1f5e1
    style SEARCH fill:#e1f5ff
    style TICKETS fill:#ffe1f5
    style PAYMENTS fill:#f5ffe1
    style USERS fill:#e1ffff
    style ADMIN fill:#ffe1e1
    style CHAT fill:#ffb5c8
    style MCP fill:#b5c8ff
    style HEALTH fill:#f5e1ff
```

## Fluxo de Busca com Código Amigável

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Chat as Chat API
    participant Service as ChatService
    participant MCP as MCP Tools
    participant Search as SearchEventsUseCase
    participant Repo as EventRepository
    participant DB as PostgreSQL
    
    User->>Chat: "Busque evento EVT-AMA3RU"
    
    Chat->>Service: processMessage()
    
    Note over Service: OpenAI identifica tool_call
    Service->>Service: mapAgentToolToMcp()
    
    Service->>MCP: callTool("search_events_by_query", {query: "EVT-AMA3RU"})
    
    MCP->>Search: execute({query: "EVT-AMA3RU"})
    
    Search->>Repo: searchByNameOrCode("EVT-AMA3RU")
    
    Repo->>DB: SELECT * WHERE code ILIKE '%EVT-AMA3RU%'
    
    DB-->>Repo: 1 evento encontrado
    
    Repo-->>Search: Event
    Search-->>MCP: EventDTO
    MCP-->>Service: dados do evento
    
    Note over Service: Formata resposta
    Service-->>Chat: "Evento encontrado: {title, date, location}"
    
    Chat-->>User: Resposta formatada
    
    Note over User: Usuário recebe informações do evento
```

## Estrutura de Autenticação

```mermaid
graph TB
    subgraph "Autenticação"
        LOGIN[Login Endpoint]
        REGISTER[Register Endpoint]
        VALIDATOR[Credential Validator]
        JWT[JWT Service]
    end
    
    subgraph "Autorização"
        GUARD[JwtAuthGuard]
        STRATEGY[JWT Strategy]
        EXTRACTOR[Token Extractor]
    end
    
    subgraph "Proteção de Rotas"
        USER_ROUTES[User Routes]
        ORG_ROUTES[Organizer Routes]
        ADMIN_ROUTES[Admin Routes]
    end
    
    LOGIN --> VALIDATOR
    REGISTER --> VALIDATOR
    VALIDATOR --> JWT
    JWT --> Token
    
    Token --> GUARD
    GUARD --> STRATEGY
    STRATEGY --> EXTRACTOR
    EXTRACTOR --> Payload
    
    Payload --> USER_ROUTES
    Payload --> ORG_ROUTES
    Payload --> ADMIN_ROUTES
    
    style LOGIN fill:#e1f5e1
    style REGISTER fill:#e1f5e1
    style GUARD fill:#fff4e1
    style STRATEGY fill:#ffe1f5
    style USER_ROUTES fill:#c8ffb5
    style ORG_ROUTES fill:#ffb5c8
    style ADMIN_ROUTES fill:#b5c8ff
```

## Fluxo de Validação de Ingresso

```mermaid
sequenceDiagram
    participant Scanner as Scanner App
    participant API as Tickets API
    participant UseCase as ValidateTicketUseCase
    participant Repo as TicketRepository
    participant DB as PostgreSQL
    participant Notify as NotificationService
    
    Scanner->>API: POST /api/tickets/validate {qrCodeData}
    Note over API: ScannerAuthGuard valida scanner
    
    API->>UseCase: execute({qrCodeData, scannerId})
    
    Note over UseCase: 1. Decodificar QR Code
    UseCase->>UseCase: parseQRCodeData()
    
    UseCase->>Repo: findByQRCode(qrCodeData)
    Repo->>DB: SELECT * WHERE qrCodeData = ...
    
    DB-->>Repo: Ticket encontrado
    
    Note over UseCase: 2. Validar status
    UseCase->>UseCase: checkTicketStatus()
    
    alt Ticket válido e não usado
        Note over UseCase: 3. Marcar como usado
        UseCase->>Repo: markAsUsed(ticketId, scannerId)
        Repo->>DB: UPDATE tickets SET status = 'USED'
        
        Note over UseCase: 4. Notificar
        UseCase->>Notify: sendValidationConfirmation()
        
        UseCase-->>API: { valid: true, ticket, timestamp }
        API-->>Scanner: 200 OK + dados do ticket
    else Ticket inválido ou já usado
        UseCase-->>API: { valid: false, reason: "..." }
        API-->>Scanner: 400 Bad Request
    end
    
    Note over Scanner: Scanner recebe confirmação
```

