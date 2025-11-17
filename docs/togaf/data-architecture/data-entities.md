# Data Entities - Modelo de Entidades e Relacionamentos

## Visão Geral

Este documento detalha o **modelo de dados** da plataforma Litoral Imóveis, descrevendo entidades, relacionamentos, constraints e regras de negócio.

## Modelo de Dados Completo

### Diagrama ER (Entity Relationship)

```mermaid
erDiagram
    USER {
        uuid id PK
        varchar name
        varchar email UK
        varchar password
        varchar phone
        varchar whatsappNumber
        enum role
        uuid preferredAgentId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    REALTOR_PROFILE {
        uuid id PK
        uuid userId FK UK
        varchar businessName
        varchar contactName
        varchar phone
        varchar email
        varchar instagram
        varchar facebook
        varchar linkedin
        varchar whatsappBusiness
        timestamp createdAt
        timestamp updatedAt
    }
    
    PROPERTY {
        uuid id PK
        varchar title
        text description
        enum type
        enum purpose
        decimal price
        varchar neighborhood
        varchar city
        int bedrooms
        int bathrooms
        decimal area
        int garageSpaces
        boolean hasPool
        boolean hasJacuzzi
        boolean oceanFront
        boolean hasGarden
        boolean hasGourmetArea
        boolean furnished
        uuid realtorId FK
        varchar coverImageUrl
        timestamp createdAt
        timestamp updatedAt
    }
    
    PROPERTY_IMAGE {
        uuid id PK
        uuid propertyId FK
        varchar url
        varchar thumbnailUrl
        varchar filePath
        varchar thumbnailPath
        boolean isCover
        int order
        timestamp createdAt
        timestamp updatedAt
    }
    
    CONVERSATION {
        uuid id PK
        varchar phoneNumber
        uuid userId FK
        varchar instanceName
        enum status
        uuid currentAgentId FK
        timestamp startedAt
        timestamp endedAt
        jsonb metadata
        timestamp createdAt
        timestamp updatedAt
    }
    
    MESSAGE {
        uuid id PK
        uuid conversationId FK
        varchar phoneNumber
        varchar messageId
        text content
        enum direction
        uuid agentId FK
        enum channel
        timestamp timestamp
        text response
        jsonb toolsUsed
        timestamp createdAt
        timestamp updatedAt
    }
    
    AGENT {
        uuid id PK
        varchar name
        varchar slug UK
        varchar route
        boolean active
        timestamp createdAt
        timestamp updatedAt
    }
    
    USER_CREDIT {
        uuid id PK
        uuid userId FK
        decimal balance
        timestamp createdAt
        timestamp updatedAt
    }
    
    USER ||--o| REALTOR_PROFILE : "has profile"
    USER ||--o{ PROPERTY : "manages as realtor"
    USER ||--o{ CONVERSATION : "participates"
    USER ||--o| USER_CREDIT : "has credit"
    USER }o--o| AGENT : "prefers"
    
    PROPERTY ||--o{ PROPERTY_IMAGE : "has images"
    PROPERTY }o--|| USER : "managed by"
    
    CONVERSATION ||--o{ MESSAGE : "contains"
    CONVERSATION }o--o| USER : "belongs to"
    CONVERSATION }o--o| AGENT : "assigned to"
    
    MESSAGE }o--|| CONVERSATION : "part of"
    MESSAGE }o--o| AGENT : "processed by"
```

## Relacionamentos Detalhados

### 1. User ↔ RealtorProfile

**Tipo**: One-to-One (Opcional)  
**Cardinalidade**: 1:0..1  
**Descrição**: Um usuário pode ter no máximo um perfil profissional (se for CORRETOR).

**Constraints**:
- `realtor_profiles.userId` é UNIQUE
- Apenas usuários com role CORRETOR devem ter perfil

**Cascade**: DELETE CASCADE (se user deletado, perfil deletado)

### 2. User ↔ Property

**Tipo**: One-to-Many  
**Cardinalidade**: 1:N  
**Descrição**: Um usuário (corretor) pode gerenciar múltiplos imóveis.

**Constraints**:
- `properties.realtorId` é obrigatório
- Apenas CORRETOR ou ADMIN podem criar propriedades

**Cascade**: Nenhum (propriedades não são deletadas se corretor deletado)

### 3. Property ↔ PropertyImage

**Tipo**: One-to-Many  
**Cardinalidade**: 1:N  
**Descrição**: Um imóvel pode ter múltiplas imagens.

**Constraints**:
- Máximo de 10 imagens por propriedade (regra de negócio)
- Apenas uma imagem pode ser capa (`isCover = true`)

**Cascade**: DELETE CASCADE (se property deletada, imagens deletadas)

### 4. User ↔ Conversation

**Tipo**: One-to-Many (Opcional)  
**Cardinalidade**: 1:N  
**Descrição**: Um usuário pode ter múltiplas conversas.

**Constraints**:
- `conversations.userId` é opcional (conversas anônimas permitidas)
- Conversas podem ser identificadas por `phoneNumber` sem `userId`

**Cascade**: Nenhum

### 5. Conversation ↔ Message

**Tipo**: One-to-Many  
**Cardinalidade**: 1:N  
**Descrição**: Uma conversa contém múltiplas mensagens.

**Constraints**:
- `messages.conversationId` é obrigatório

**Cascade**: DELETE CASCADE (se conversation deletada, messages deletadas)

### 6. Conversation ↔ Agent

**Tipo**: Many-to-One (Opcional)  
**Cardinalidade**: N:1  
**Descrição**: Múltiplas conversas podem ser atribuídas a um agente.

**Constraints**:
- `conversations.currentAgentId` é opcional

**Cascade**: Nenhum

### 7. Message ↔ Agent

**Tipo**: Many-to-One (Opcional)  
**Cardinalidade**: N:1  
**Descrição**: Mensagens podem ser processadas por um agente.

**Constraints**:
- `messages.agentId` é opcional

**Cascade**: Nenhum

### 8. User ↔ UserCredit

**Tipo**: One-to-One  
**Cardinalidade**: 1:1  
**Descrição**: Cada usuário tem um registro de crédito.

**Constraints**:
- `user_credits.userId` é UNIQUE
- Balance padrão é 0

**Cascade**: DELETE CASCADE

## Constraints e Validações

### Constraints de Banco de Dados

**Property**:
- `price > 0`
- `area > 0`
- `bedrooms >= 0`
- `bathrooms >= 0`
- `garageSpaces >= 0`

**PropertyImage**:
- `order >= 0`
- Máximo 10 imagens por propriedade (aplicação)

**User**:
- `email` UNIQUE
- `password` não pode ser vazio
- `role` deve ser um dos valores válidos

**Conversation**:
- `phoneNumber` não pode ser vazio
- `startedAt <= endedAt` (se endedAt não for null)

**Message**:
- `content` não pode ser vazio
- `timestamp` não pode ser futuro

**UserCredit**:
- `balance >= 0`

## Regras de Negócio no Domínio

### Property Entity

```typescript
// Métodos de domínio
belongsToRealtor(realtorId: string): boolean
updatePrice(newPrice: number): void  // Valida price > 0
updateArea(newArea: number): void     // Valida area > 0
getCoverImage(): string | null
```

### PropertyImage Entity

```typescript
// Métodos de domínio
setAsCover(): void
removeAsCover(): void
updateOrder(newOrder: number): void  // Valida order >= 0
```

### User Entity

```typescript
// Métodos de domínio
isAdmin(): boolean
isCorretor(): boolean
canManageUsers(): boolean
canManageProperties(): boolean
updateProfile(name, phone, whatsappNumber): User
changeRole(newRole: UserRole): User
toPublic(): User  // Remove password
```

### Conversation Entity

```typescript
// Métodos de domínio
isActive(): boolean
end(): void
associateUser(userId: string): void
```

### Message Entity

```typescript
// Métodos de domínio
isIncoming(): boolean
isOutgoing(): boolean
setResponse(response: string, toolsUsed?: any[]): void
```

### UserCredit Entity

```typescript
// Métodos de domínio
addCredit(amount: number): void      // Valida amount > 0
deductCredit(amount: number): void   // Valida amount > 0 e saldo suficiente
hasEnoughCredit(amount: number): boolean
getBalance(): number
```

## Normalização

### Nível de Normalização: 3NF (Terceira Forma Normal)

**Justificativa**:
- Todas as entidades estão normalizadas
- Não há dependências transitivas
- Chaves primárias bem definidas
- Relacionamentos através de FKs

**Exceções Intencionais**:
- `Property.coverImageUrl`: Denormalização para performance (evita join)
- `Message.response` e `Message.toolsUsed`: Dados derivados para histórico

## Integridade Referencial

### Foreign Keys

| Tabela | FK | Referência | Ação |
|--------|----|-----------|------|
| properties | realtorId | users.id | RESTRICT |
| property_images | propertyId | properties.id | CASCADE |
| realtor_profiles | userId | users.id | CASCADE |
| conversations | userId | users.id | SET NULL |
| conversations | currentAgentId | agents.id | SET NULL |
| messages | conversationId | conversations.id | CASCADE |
| messages | agentId | agents.id | SET NULL |
| user_credits | userId | users.id | CASCADE |
| users | preferredAgentId | agents.id | SET NULL |

## Índices para Performance

### Índices Únicos
- `users.email`
- `realtor_profiles.userId`
- `agents.slug`

### Índices de Busca
- `properties.realtorId`
- `properties.city`
- `conversations.phoneNumber`
- `conversations.userId`
- `messages.conversationId`
- `messages.timestamp`
- `messages.phoneNumber`

## Próximas Melhorias

- [ ] Adicionar índices compostos para queries complexas
- [ ] Implementar particionamento de tabelas grandes (messages, conversations)
- [ ] Adicionar campos de auditoria (createdBy, updatedBy)
- [ ] Implementar soft delete para dados críticos
- [ ] Adicionar versionamento de entidades (otimistic locking)

