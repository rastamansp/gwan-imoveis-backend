# Data Flow Diagram - Diagrama de Fluxo de Dados

## Visão Geral

Este documento apresenta os **diagramas de fluxo de dados** da plataforma Litoral Imóveis, mostrando como os dados fluem entre sistemas, processos e armazenamentos.

## Fluxo de Dados Principal

### Diagrama de Contexto (Nível 0)

```mermaid
graph TB
    subgraph "External Entities"
        CLIENT[Cliente<br/>Web/Mobile]
        CORRETOR[Corretor]
        ADMIN[Administrador]
        OPENAI[OpenAI API]
        EVOLUTION[Evolution API]
    end
    
    subgraph "System"
        SYSTEM[Litoral Imóveis<br/>Backend]
    end
    
    subgraph "Data Stores"
        DB[(PostgreSQL)]
        STORAGE[MinIO<br/>Storage]
        CACHE[(Redis<br/>Cache)]
    end
    
    CLIENT -->|Consulta Imóveis| SYSTEM
    CLIENT -->|Chat| SYSTEM
    CORRETOR -->|Cadastra Imóveis| SYSTEM
    ADMIN -->|Gerencia Sistema| SYSTEM
    OPENAI -->|Processa Chat| SYSTEM
    EVOLUTION -->|Webhooks| SYSTEM
    
    SYSTEM -->|Lê/Escreve| DB
    SYSTEM -->|Armazena| STORAGE
    SYSTEM -->|Cache| CACHE
```

## Fluxos de Dados Detalhados

### 1. Fluxo: Cadastro de Imóvel

```mermaid
flowchart TD
    START([Corretor inicia cadastro])
    INPUT[Input: Dados do imóvel]
    VALIDATE{Validar DTO}
    VALIDATE -->|Inválido| ERROR[Erro de validação]
    VALIDATE -->|Válido| CHECK_PERM[Verificar permissões]
    CHECK_PERM -->|Sem permissão| AUTH_ERROR[Erro de autenticação]
    CHECK_PERM -->|Autorizado| CREATE_ENTITY[Criar entidade Property]
    CREATE_ENTITY --> SAVE_DB[(Salvar no PostgreSQL)]
    SAVE_DB --> RESPONSE[Retornar Property criado]
    RESPONSE --> END([Fim])
    
    ERROR --> END
    AUTH_ERROR --> END
```

**Dados Envolvidos**:
- Input: CreatePropertyDto
- Processamento: Property Entity
- Output: PropertyResponseDto
- Persistência: `properties` table

### 2. Fluxo: Upload de Imagem

```mermaid
flowchart TD
    START([Upload de imagem])
    RECEIVE[Receber arquivo]
    VALIDATE_FILE{Validar arquivo}
    VALIDATE_FILE -->|Inválido| ERROR[Erro]
    VALIDATE_FILE -->|Válido| PROCESS[Processar imagem<br/>Sharp]
    PROCESS --> GEN_THUMB[Gerar thumbnail]
    GEN_THUMB --> UPLOAD_ORIG[Upload original<br/>MinIO]
    UPLOAD_ORIG --> UPLOAD_THUMB[Upload thumbnail<br/>MinIO]
    UPLOAD_THUMB --> SAVE_DB[(Salvar PropertyImage)]
    SAVE_DB --> UPDATE_COVER{É capa?}
    UPDATE_COVER -->|Sim| UPDATE_PROP[Atualizar coverImageUrl]
    UPDATE_COVER -->|Não| RESPONSE[Retornar imagem]
    UPDATE_PROP --> RESPONSE
    RESPONSE --> END([Fim])
    
    ERROR --> END
```

**Dados Envolvidos**:
- Input: Multipart file
- Processamento: Buffer → Processed Image → Thumbnail
- Storage: MinIO (original + thumbnail)
- Persistência: `property_images` table
- Output: PropertyImageResponseDto

### 3. Fluxo: Busca de Imóveis

```mermaid
flowchart TD
    START([Cliente busca imóveis])
    INPUT[Input: Filtros]
    CHECK_CACHE{Cache hit?}
    CHECK_CACHE -->|Sim| RETURN_CACHE[Retornar do cache]
    CHECK_CACHE -->|Não| QUERY_DB[(Query PostgreSQL)]
    QUERY_DB --> FILTER[Filtrar resultados]
    FILTER --> LOAD_IMAGES[Carregar imagens<br/>se necessário]
    LOAD_IMAGES --> FORMAT[Formatar resposta]
    FORMAT --> CACHE_DATA[(Salvar no cache)]
    CACHE_DATA --> RETURN[Retornar resultados]
    RETURN_CACHE --> END([Fim])
    RETURN --> END
```

**Dados Envolvidos**:
- Input: Query parameters (filters)
- Cache: Redis (chave: `properties:{filters}`)
- Database: `properties` table + `property_images` table
- Output: PropertyResponseDto[]

### 4. Fluxo: Atendimento via Chat

```mermaid
flowchart TD
    START([Mensagem do usuário])
    RECEIVE[Receber mensagem]
    CHECK_SESSION{Session existe?}
    CHECK_SESSION -->|Não| CREATE_SESSION[Criar Conversation]
    CHECK_SESSION -->|Sim| LOAD_SESSION[Carregar Conversation]
    CREATE_SESSION --> SAVE_MSG[Salvar Message<br/>INCOMING]
    LOAD_SESSION --> SAVE_MSG
    SAVE_MSG --> SEND_OPENAI[Enviar para OpenAI]
    SEND_OPENAI --> OPENAI_DECIDE{OpenAI decide<br/>usar tool?}
    OPENAI_DECIDE -->|Sim| CALL_MCP[Chamar MCP Tool]
    OPENAI_DECIDE -->|Não| GENERATE[Gerar resposta]
    CALL_MCP --> MCP_CALL[MCP chama Backend API]
    MCP_CALL --> GET_DATA[(Obter dados)]
    GET_DATA --> RETURN_MCP[Retornar para OpenAI]
    RETURN_MCP --> GENERATE
    GENERATE --> FORMAT_RESP[Formatar resposta]
    FORMAT_RESP --> SAVE_RESP[Salvar Message<br/>OUTGOING]
    SAVE_RESP --> RETURN[Retornar resposta]
    RETURN --> END([Fim])
```

**Dados Envolvidos**:
- Input: ChatRequestDto (message, sessionId, userCtx)
- Processamento: OpenAI API, MCP Tools
- Persistência: `conversations`, `messages` tables
- Output: ChatResponseDto

### 5. Fluxo: Atendimento via WhatsApp

```mermaid
flowchart TD
    START([Mensagem WhatsApp])
    WEBHOOK[Receber webhook<br/>Evolution API]
    PARSE[Parsear evento]
    CHECK_USER{Usuário existe?}
    CHECK_USER -->|Não| REGISTER[Registrar User<br/>automático]
    CHECK_USER -->|Sim| LOAD_USER[Carregar User]
    REGISTER --> CREATE_CONV[Criar/Encontrar Conversation]
    LOAD_USER --> CREATE_CONV
    CREATE_CONV --> SAVE_MSG[Salvar Message<br/>INCOMING]
    SAVE_MSG --> PROCESS[Processar via Chat Service]
    PROCESS --> GET_RESPONSE[Obter resposta]
    GET_RESPONSE --> SEND_EVO[Enviar via Evolution API SDK]
    SEND_EVO --> SAVE_OUT[Salvar Message<br/>OUTGOING]
    SAVE_OUT --> END([Fim])
```

**Dados Envolvidos**:
- Input: Evolution API webhook payload
- Processamento: Chat Service (similar ao fluxo de chat)
- Persistência: `users`, `conversations`, `messages` tables
- Output: Mensagem enviada via Evolution API

## Fluxos de Dados entre Sistemas

### Backend API ↔ Database

```mermaid
sequenceDiagram
    participant API as Backend API
    participant ORM as TypeORM
    participant DB as PostgreSQL
    
    API->>ORM: Repository.save(entity)
    ORM->>ORM: Validate entity
    ORM->>DB: INSERT/UPDATE SQL
    DB->>DB: Validate constraints
    DB-->>ORM: Result
    ORM-->>API: Entity
    
    API->>ORM: Repository.find()
    ORM->>DB: SELECT SQL
    DB-->>ORM: Rows
    ORM->>ORM: Map to entities
    ORM-->>API: Entities[]
```

### Storage Service ↔ MinIO

```mermaid
sequenceDiagram
    participant APP as Application
    participant STORAGE as Storage Service
    participant MINIO as MinIO
    
    APP->>STORAGE: uploadFile(buffer, filename, path)
    STORAGE->>STORAGE: Process image (Sharp)
    STORAGE->>MINIO: putObject(bucket, key, buffer)
    MINIO-->>STORAGE: Success
    STORAGE->>STORAGE: Generate URL
    STORAGE-->>APP: File URL
```

### Chat Service ↔ OpenAI ↔ MCP ↔ Backend API

```mermaid
sequenceDiagram
    participant CHAT as Chat Service
    participant OPENAI as OpenAI API
    participant MCP as MCP Server
    participant API as Backend API
    participant DB as Database
    
    CHAT->>OPENAI: Send message + tools
    OPENAI->>OPENAI: Process & decide tool
    OPENAI->>MCP: Call list_properties
    MCP->>API: GET /api/properties
    API->>DB: Query
    DB-->>API: Data
    API-->>MCP: JSON
    MCP-->>OPENAI: Tool result
    OPENAI->>OPENAI: Format response
    OPENAI-->>CHAT: Answer
```

## Transformações de Dados

### 1. DTO → Entity

**Fluxo**: CreatePropertyDto → Property Entity

```typescript
// Input (DTO)
{
  title: "Casa de Praia",
  price: 850000,
  type: "CASA"
}

// Transformação
const property = new Property();
property.title = dto.title;
property.price = dto.price;
property.type = dto.type;

// Output (Entity)
Property {
  id: "uuid",
  title: "Casa de Praia",
  price: 850000,
  type: PropertyType.CASA
}
```

### 2. Entity → DTO

**Fluxo**: Property Entity → PropertyResponseDto

```typescript
// Input (Entity)
Property {
  id: "uuid",
  title: "Casa de Praia",
  price: 850000,
  realtor: User {...}
}

// Transformação
PropertyResponseDto.fromEntity(property)

// Output (DTO)
{
  id: "uuid",
  title: "Casa de Praia",
  price: 850000,
  realtor: {
    id: "uuid",
    name: "João Silva"
  }
}
```

### 3. Image Processing

**Fluxo**: Raw Image → Processed → Thumbnail

```typescript
// Input: Buffer (raw image)
// Processamento: Sharp
- Resize original (max 1920x1080)
- Generate thumbnail (400x300)
- Optimize quality

// Output: 2 buffers
- Original processed
- Thumbnail
```

## Armazenamento de Dados

### Estrutura de Armazenamento

**PostgreSQL**:
- Tabelas relacionais
- Índices para performance
- Constraints de integridade
- JSONB para dados flexíveis

**MinIO**:
- Estrutura: `bucket/properties/{propertyId}/{filename}`
- Original: `{timestamp}-original-image-{index}.jpg`
- Thumbnail: `thumb-{timestamp}-original-image-{index}.jpg`

**Redis**:
- Chaves: `properties:{filters_hash}`
- TTL: 1 hora
- Formato: JSON serializado

## Volume de Dados por Fluxo

| Fluxo | Volume por Operação | Frequência | Volume Total/Dia |
|-------|-------------------|------------|------------------|
| Cadastro Imóvel | ~5 KB | 10-100/dia | 50-500 KB |
| Upload Imagem | ~500 KB | 50-500/dia | 25-250 MB |
| Busca Imóveis | ~50 KB | 1.000-10.000/dia | 50-500 MB |
| Chat Message | ~2 KB | 5.000-50.000/dia | 10-100 MB |
| WhatsApp Message | ~2 KB | 2.000-20.000/dia | 4-40 MB |

## Próximas Melhorias

- [ ] Implementar cache distribuído (Redis Cluster)
- [ ] Adicionar CDN para imagens
- [ ] Implementar data warehouse para analytics
- [ ] Adicionar streaming de dados (Kafka)
- [ ] Implementar data lake para logs

