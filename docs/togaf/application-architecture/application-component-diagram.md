# Application Component Diagram

## Visão Geral

Este documento apresenta o **diagrama de componentes de aplicação**, mostrando a estrutura interna das aplicações e como os componentes se relacionam.

## Arquitetura de Componentes

### Backend API - Estrutura de Componentes

```mermaid
graph TB
    subgraph "Presentation Layer"
        CTRL[Controllers]
        DTO[DTOs]
        FILTER[Exception Filters]
    end
    
    subgraph "Application Layer"
        UC[Use Cases]
        INT[Interfaces]
    end
    
    subgraph "Domain Layer"
        ENT[Entities]
        VO[Value Objects]
        REPO_INT[Repository Interfaces]
        EXC[Exceptions]
    end
    
    subgraph "Infrastructure Layer"
        REPO_IMPL[Repository Implementations]
        EXT_SVC[External Services]
        MIDDLEWARE[Middleware]
    end
    
    CTRL --> DTO
    CTRL --> UC
    CTRL --> FILTER
    UC --> INT
    UC --> ENT
    UC --> REPO_INT
    REPO_INT --> REPO_IMPL
    REPO_IMPL --> DB[(Database)]
    EXT_SVC --> STORAGE[Storage]
    EXT_SVC --> CACHE[Cache]
```

## Componentes por Camada

### 1. Presentation Layer (Camada de Apresentação)

**Componentes**:
- **Controllers**: Recebem requisições HTTP e delegam para Use Cases
  - PropertiesController
  - PropertyImagesController
  - AuthController
  - UsersController
  - RealtorsController
  - AdminController
  - ChatController
  - WhatsAppWebhookController
  - HealthController
  - McpBridgeController

- **DTOs**: Data Transfer Objects para validação e transformação
  - CreatePropertyDto
  - UpdatePropertyDto
  - PropertyResponseDto
  - ChatRequestDto
  - ChatResponseDto
  - LoginDto
  - RegisterDto

- **Exception Filters**: Tratamento global de exceções
  - DomainExceptionFilter
  - HttpExceptionFilter

**Localização**: `src/*/presentation/dtos/`, `src/*/*.controller.ts`

### 2. Application Layer (Camada de Aplicação)

**Componentes**:
- **Use Cases**: Lógica de negócio da aplicação
  - CreatePropertyUseCase
  - UpdatePropertyUseCase
  - DeletePropertyUseCase
  - ListPropertiesUseCase
  - GetPropertyByIdUseCase
  - CreatePropertyImageUseCase
  - RegisterUserUseCase
  - LoginUserUseCase
  - PromoteUserToCorretorUseCase
  - (23 use cases no total)

- **Interfaces**: Contratos para serviços externos
  - ILogger
  - IEmailService (futuro)
  - IStorageService

**Localização**: `src/shared/application/use-cases/`, `src/shared/application/interfaces/`

### 3. Domain Layer (Camada de Domínio)

**Componentes**:
- **Entities**: Entidades de negócio
  - Property
  - PropertyImage
  - User
  - RealtorProfile
  - Conversation
  - Message
  - Agent
  - UserCredit

- **Value Objects**: Objetos de valor imutáveis
  - PropertyType
  - PropertyPurpose
  - UserRole
  - MessageDirection
  - MessageChannel

- **Repository Interfaces**: Contratos para persistência
  - IPropertyRepository
  - IPropertyImageRepository
  - IUserRepository
  - IRealtorProfileRepository
  - IConversationRepository
  - IMessageRepository

- **Exceptions**: Exceções de domínio
  - DomainException
  - PropertyNotFoundException
  - UserNotFoundException
  - (11 exceções no total)

**Localização**: `src/shared/domain/`

### 4. Infrastructure Layer (Camada de Infraestrutura)

**Componentes**:
- **Repository Implementations**: Implementações TypeORM
  - PropertyTypeOrmRepository
  - PropertyImageTypeOrmRepository
  - UserTypeOrmRepository
  - RealtorProfileTypeOrmRepository
  - ConversationTypeOrmRepository
  - MessageTypeOrmRepository

- **External Services**: Serviços externos
  - StorageService (MinIO)
  - LoggerService (NestJS Logger)
  - (Futuro: EmailService, SMSService)

- **Middleware**: Middleware de aplicação
  - LoggingMiddleware

**Localização**: `src/shared/infrastructure/`

## Diagrama de Componentes por Módulo

### Properties Module

```mermaid
graph TB
    PC[PropertiesController]
    PIC[PropertyImagesController]
    
    UC1[CreatePropertyUseCase]
    UC2[UpdatePropertyUseCase]
    UC3[DeletePropertyUseCase]
    UC4[ListPropertiesUseCase]
    UC5[GetPropertyByIdUseCase]
    UC6[CreatePropertyImageUseCase]
    UC7[ListPropertyImagesUseCase]
    
    REPO1[IPropertyRepository]
    REPO2[IPropertyImageRepository]
    
    ENT1[Property Entity]
    ENT2[PropertyImage Entity]
    
    STORAGE[StorageService]
    
    PC --> UC1
    PC --> UC2
    PC --> UC3
    PC --> UC4
    PC --> UC5
    
    PIC --> UC6
    PIC --> UC7
    
    UC1 --> REPO1
    UC2 --> REPO1
    UC3 --> REPO1
    UC4 --> REPO1
    UC5 --> REPO1
    
    UC6 --> REPO2
    UC7 --> REPO2
    
    UC6 --> STORAGE
    
    REPO1 --> ENT1
    REPO2 --> ENT2
```

### Chat Module

```mermaid
graph TB
    CC[ChatController]
    CS[ChatService]
    
    FORMATTER[ResponseFormatterService]
    WEB_FORMAT[WebFormatterService]
    WHATSAPP_FORMAT[WhatsAppFormatterService]
    PAGINATION[PaginationService]
    SUGGESTIONS[SuggestionsService]
    
    MCP[MCP Service]
    OPENAI[OpenAI API]
    
    CC --> CS
    CS --> FORMATTER
    CS --> MCP
    CS --> OPENAI
    
    FORMATTER --> WEB_FORMAT
    FORMATTER --> WHATSAPP_FORMAT
    FORMATTER --> PAGINATION
    FORMATTER --> SUGGESTIONS
```

### Auth Module

```mermaid
graph TB
    AC[AuthController]
    
    UC1[RegisterUserUseCase]
    UC2[LoginUserUseCase]
    
    JWT_STRATEGY[JwtStrategy]
    LOCAL_STRATEGY[LocalStrategy]
    
    JWT_GUARD[JwtAuthGuard]
    LOCAL_GUARD[LocalAuthGuard]
    CORRETOR_GUARD[CorretorOrAdminGuard]
    
    USER_REPO[IUserRepository]
    USER_ENT[User Entity]
    
    AC --> UC1
    AC --> UC2
    
    UC1 --> USER_REPO
    UC2 --> USER_REPO
    
    JWT_STRATEGY --> USER_REPO
    LOCAL_STRATEGY --> USER_REPO
    
    USER_REPO --> USER_ENT
```

## Fluxo de Dados entre Componentes

```mermaid
sequenceDiagram
    participant C as Controller
    participant DTO as DTO
    participant UC as Use Case
    participant REPO_INT as Repository Interface
    participant REPO_IMPL as Repository Implementation
    participant ENT as Entity
    participant DB as Database
    
    C->>DTO: Valida Request
    DTO-->>C: DTO Validado
    C->>UC: Execute Use Case
    UC->>REPO_INT: Call Repository
    REPO_INT->>REPO_IMPL: Delegate
    REPO_IMPL->>ENT: Load Entity
    REPO_IMPL->>DB: Query Database
    DB-->>REPO_IMPL: Data
    REPO_IMPL-->>REPO_INT: Entity
    REPO_INT-->>UC: Entity
    UC->>ENT: Business Logic
    ENT-->>UC: Updated Entity
    UC->>REPO_INT: Save Entity
    REPO_INT->>REPO_IMPL: Save
    REPO_IMPL->>DB: Persist
    DB-->>REPO_IMPL: Confirmation
    REPO_IMPL-->>REPO_INT: Saved Entity
    REPO_INT-->>UC: Saved Entity
    UC-->>C: Result
    C->>DTO: Transform to Response
    DTO-->>C: Response DTO
    C-->>Client: HTTP Response
```

## Princípios de Design Aplicados

### Dependency Inversion
- Controllers dependem de Use Cases (interfaces)
- Use Cases dependem de Repository Interfaces
- Implementações concretas injetadas via DI

### Single Responsibility
- Cada Use Case tem uma responsabilidade única
- Controllers apenas orquestram
- Repositories apenas acessam dados

### Open/Closed
- Novos Use Cases podem ser adicionados sem modificar existentes
- Novos formatadores podem ser adicionados sem modificar ChatService

## Tecnologias por Camada

| Camada | Tecnologias |
|--------|------------|
| Presentation | NestJS Controllers, class-validator, class-transformer, Swagger |
| Application | TypeScript, NestJS Injectable |
| Domain | TypeScript, TypeORM Decorators |
| Infrastructure | TypeORM, MinIO Client, Sharp, NestJS Logger |

## Próximos Componentes

- [ ] Notification Component (notificações)
- [ ] Analytics Component (métricas)
- [ ] Payment Component (pagamentos)
- [ ] Search Component (busca avançada)
- [ ] Report Component (relatórios)

