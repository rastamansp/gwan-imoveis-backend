# Fluxo Completo do Usuário - Plataforma de Eventos

## Diagrama de Fluxo do Usuário

```mermaid
graph TD
    A[Usuário acessa a plataforma] --> B{Cadastrado?}
    
    B -->|Não| C[Registro de usuário]
    C --> D[POST /api/auth/register]
    D --> E[Login automático]
    
    B -->|Sim| F[Login]
    F --> G[POST /api/auth/login]
    
    E --> H[Dashboard do usuário]
    G --> H
    
    H --> I[Buscar eventos]
    I --> J[GET /api/events]
    J --> K[Lista de eventos]
    
    K --> L[Selecionar evento]
    L --> M[GET /api/events/:id]
    M --> N[Detalhes do evento]
    
    N --> O[Ver categorias de ingressos]
    O --> P[GET /api/events/:id/ticket-categories]
    P --> Q[Lista de categorias]
    
    Q --> R[Escolher categoria e quantidade]
    R --> S[Adicionar ao carrinho]
    
    S --> T[Processar pagamento]
    T --> U[POST /api/payments/process]
    U --> V[Gateway de pagamento]
    
    V --> W{Pagamento aprovado?}
    W -->|Não| X[Exibir erro de pagamento]
    X --> T
    
    W -->|Sim| Y[POST /api/tickets/purchase]
    Y --> Z[Ingresso gerado]
    Z --> AA[Email de confirmação]
    
    AA --> BB[Usuário recebe ingresso]
    BB --> CC[Dia do evento - Check-in]
    
    CC --> DD[Apresentar ingresso]
    DD --> EE[POST /api/tickets/validate]
    EE --> FF{Ingresso válido?}
    
    FF -->|Não| GG[Exibir erro]
    GG --> DD
    
    FF -->|Sim| HH[POST /api/tickets/checkin]
    HH --> II[Check-in realizado]
    II --> JJ[Acesso liberado ao evento]
    
    style A fill:#e1f5fe
    style C fill:#fff3e0
    style F fill:#fff3e0
    style D fill:#f3e5f5
    style G fill:#f3e5f5
    style J fill:#e8f5e8
    style M fill:#e8f5e8
    style P fill:#e8f5e8
    style U fill:#fff8e1
    style Y fill:#fff8e1
    style EE fill:#fce4ec
    style HH fill:#fce4ec
    style JJ fill:#e8f5e8
```

## Fluxo Detalhado por Etapas

### 1. Autenticação
- **Registro**: Usuário cria conta com email e senha
- **Login**: Usuário faz login com credenciais

### 2. Descoberta de Eventos
- **Listagem**: Usuário visualiza eventos disponíveis
- **Filtros**: Pode filtrar por data, localização, categoria
- **Detalhes**: Visualiza informações completas do evento

### 3. Seleção de Ingressos
- **Categorias**: Visualiza tipos de ingressos disponíveis
- **Preços**: Compara preços e benefícios
- **Quantidade**: Escolhe quantidade desejada

### 4. Processo de Pagamento
- **Carrinho**: Adiciona ingressos ao carrinho
- **Checkout**: Processa pagamento via gateway
- **Confirmação**: Recebe confirmação e ingresso

### 5. Check-in no Evento
- **Apresentação**: Mostra ingresso no local
- **Validação**: Sistema valida ingresso
- **Acesso**: Libera entrada no evento

## APIs Necessárias para Implementação

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/profile` - Perfil do usuário
- `POST /api/auth/refresh` - Renovar token

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Detalhes do evento
- `GET /api/events/:id/ticket-categories` - Categorias de ingressos
- `GET /api/events/search` - Buscar eventos

### Ingressos
- `POST /api/tickets/purchase` - Comprar ingresso
- `GET /api/tickets/my-tickets` - Meus ingressos
- `GET /api/tickets/:id` - Detalhes do ingresso
- `POST /api/tickets/validate` - Validar ingresso
- `POST /api/tickets/checkin` - Fazer check-in

### Pagamentos
- `POST /api/payments/process` - Processar pagamento
- `GET /api/payments/:id/status` - Status do pagamento
- `POST /api/payments/webhook` - Webhook do gateway

### Usuários
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users/tickets` - Histórico de ingressos

### Administração
- `POST /api/admin/events` - Criar evento
- `PUT /api/admin/events/:id` - Atualizar evento
- `GET /api/admin/events/:id/stats` - Estatísticas do evento
- `GET /api/admin/tickets/checkins` - Relatório de check-ins
