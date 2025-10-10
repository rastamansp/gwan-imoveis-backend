# 🏗️ Arquitetura do Sistema

## Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph "Frontend"
        FE[Frontend Web]
        FE_MOBILE[Mobile App]
    end
    
    subgraph "API Gateway"
        GW[API Gateway]
        LB[Load Balancer]
    end
    
    subgraph "Backend Services"
        API[REST API<br/>NestJS]
        MCP[MCP Server<br/>Model Context Protocol]
        AUTH[Auth Service]
        PAYMENT[Payment Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database)]
        REDIS[(Redis<br/>Cache)]
        FILES[File Storage<br/>S3/MinIO]
    end
    
    subgraph "External Services"
        EMAIL[Email Service<br/>SMTP/SendGrid]
        SMS[SMS Service<br/>Twilio]
        PAYMENT_GW[Payment Gateway<br/>Stripe/MercadoPago]
    end
    
    subgraph "Monitoring"
        LOGS[Logs<br/>ELK Stack]
        METRICS[Metrics<br/>Prometheus]
        ALERTS[Alerts<br/>Grafana]
    end
    
    FE --> GW
    FE_MOBILE --> GW
    GW --> LB
    LB --> API
    LB --> MCP
    
    API --> AUTH
    API --> PAYMENT
    API --> DB
    API --> REDIS
    API --> FILES
    
    MCP --> API
    
    PAYMENT --> PAYMENT_GW
    API --> EMAIL
    API --> SMS
    
    API --> LOGS
    API --> METRICS
    METRICS --> ALERTS
```

## Arquitetura Clean Architecture

```mermaid
graph TB
    subgraph "Frameworks & Drivers"
        WEB[Web Framework<br/>NestJS]
        DB[Database<br/>TypeORM]
        MQ[Message Queue<br/>RabbitMQ]
        CACHE[Cache<br/>Redis]
    end
    
    subgraph "Interface Adapters"
        CONTROLLERS[Controllers]
        REPOSITORIES[Repositories]
        SERVICES[External Services]
        PRESENTERS[Presenters]
    end
    
    subgraph "Application Business Rules"
        USE_CASES[Use Cases]
        INTERFACES[Interfaces]
        DTOs[DTOs]
    end
    
    subgraph "Enterprise Business Rules"
        ENTITIES[Entities]
        VALUE_OBJECTS[Value Objects]
        DOMAIN_SERVICES[Domain Services]
    end
    
    WEB --> CONTROLLERS
    CONTROLLERS --> USE_CASES
    USE_CASES --> ENTITIES
    USE_CASES --> REPOSITORIES
    REPOSITORIES --> DB
    
    USE_CASES --> SERVICES
    SERVICES --> MQ
    SERVICES --> CACHE
    
    ENTITIES --> VALUE_OBJECTS
    ENTITIES --> DOMAIN_SERVICES
```

## Fluxo de Dados Principal

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant N as NestJS API
    participant D as Database
    participant E as External Services
    
    U->>F: Acessa aplicação
    F->>A: Request HTTP
    A->>N: Roteamento
    N->>N: Validação
    N->>N: Autenticação
    N->>D: Query/Command
    D-->>N: Response
    N->>E: Chamada externa (opcional)
    E-->>N: Response
    N->>N: Processamento
    N-->>A: Response
    A-->>F: Response
    F-->>U: Interface atualizada
```

## Arquitetura MCP

```mermaid
graph TB
    subgraph "MCP Client"
        CLAUDE[Claude Desktop]
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
        AUTH_MW[Auth Middleware]
    end
    
    subgraph "Backend API"
        NESTJS[NestJS API]
        SWAGGER[Swagger/OpenAPI]
    end
    
    CLAUDE --> STDIO
    OTHER --> SSE
    STDIO --> SERVER
    SSE --> SERVER
    
    SERVER --> CONVERTER
    CONVERTER --> SWAGGER
    SERVER --> HANDLER
    HANDLER --> AUTH_MW
    AUTH_MW --> NESTJS
    
    NESTJS --> SWAGGER
```

## Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant AUTH as Auth Service
    participant DB as Database
    
    U->>F: Login
    F->>A: POST /auth/login
    A->>AUTH: Validate credentials
    AUTH->>DB: Check user
    DB-->>AUTH: User data
    AUTH->>AUTH: Generate JWT
    AUTH-->>A: JWT token
    A-->>F: Token + user data
    F->>F: Store token
    
    Note over F: Subsequent requests
    F->>A: Request + Authorization header
    A->>A: Validate JWT
    A->>A: Process request
    A-->>F: Response
```

## Fluxo de Compra de Ingressos

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant P as Payment Service
    participant PG as Payment Gateway
    participant T as Ticket Service
    participant DB as Database
    
    U->>F: Seleciona ingressos
    F->>A: POST /tickets/purchase
    A->>A: Validate request
    A->>T: Create ticket order
    T->>DB: Save order
    T-->>A: Order created
    
    A->>P: Process payment
    P->>PG: Charge payment
    PG-->>P: Payment result
    
    alt Payment Success
        P->>T: Confirm order
        T->>DB: Update order status
        T->>T: Generate tickets
        T-->>A: Tickets generated
        A-->>F: Success + tickets
    else Payment Failed
        P->>T: Cancel order
        T->>DB: Update order status
        T-->>A: Order cancelled
        A-->>F: Payment failed
    end
```
