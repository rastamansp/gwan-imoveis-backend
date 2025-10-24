# Chamadas de API - Fluxo Completo do Usuário

## 1. Registro e Autenticação

### Registro de Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "João Silva",
  "phone": "+5511999999999"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "phone": "+5511999999999"
  },
  "access_token": "jwt-token",
  "refresh_token": "refresh-token"
}
```

### Login de Usuário
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "usuario@exemplo.com",
    "name": "João Silva"
  },
  "access_token": "jwt-token",
  "refresh_token": "refresh-token"
}
```

## 2. Descoberta de Eventos

### Listar Eventos Disponíveis
```http
GET /api/events?page=1&limit=10&date=2024-06-15&location=São Paulo
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "events": [
    {
      "id": "event-uuid",
      "title": "Festival de Música Eletrônica",
      "description": "O maior festival da cidade",
      "date": "2024-06-15T20:00:00Z",
      "location": "Parque Ibirapuera",
      "image": "https://exemplo.com/image.jpg",
      "status": "ACTIVE",
      "maxCapacity": 5000,
      "soldTickets": 1200
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Detalhes do Evento
```http
GET /api/events/event-uuid
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "id": "event-uuid",
  "title": "Festival de Música Eletrônica",
  "description": "O maior festival da cidade com os melhores DJs",
  "date": "2024-06-15T20:00:00Z",
  "location": "Parque Ibirapuera",
  "address": "Av. Pedro Álvares Cabral, s/n - Vila Mariana",
  "image": "https://exemplo.com/image.jpg",
  "status": "ACTIVE",
  "maxCapacity": 5000,
  "soldTickets": 1200,
  "organizer": {
    "id": "org-uuid",
    "name": "Produtora XYZ",
    "email": "contato@produtoraxyz.com"
  }
}
```

### Categorias de Ingressos
```http
GET /api/events/event-uuid/ticket-categories
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "categories": [
    {
      "id": "cat-uuid-1",
      "name": "Pista",
      "description": "Acesso à pista principal",
      "price": 150.00,
      "available": 800,
      "maxPerUser": 4,
      "benefits": ["Acesso à pista", "Barracas de comida"]
    },
    {
      "id": "cat-uuid-2", 
      "name": "VIP",
      "description": "Área VIP com open bar",
      "price": 300.00,
      "available": 200,
      "maxPerUser": 2,
      "benefits": ["Área VIP", "Open bar", "Estacionamento"]
    }
  ]
}
```

## 3. Compra de Ingressos

### Adicionar ao Carrinho (Frontend)
```javascript
// Frontend - Estado do carrinho
const cartItem = {
  eventId: "event-uuid",
  categoryId: "cat-uuid-1",
  quantity: 2,
  price: 150.00
}
```

### Processar Pagamento
```http
POST /api/payments/process
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "eventId": "event-uuid",
  "tickets": [
    {
      "categoryId": "cat-uuid-1",
      "quantity": 2
    }
  ],
  "paymentMethod": "credit_card",
  "paymentData": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "holderName": "JOÃO SILVA"
  }
}
```

**Resposta:**
```json
{
  "paymentId": "payment-uuid",
  "status": "processing",
  "amount": 300.00,
  "gatewayResponse": {
    "transactionId": "gateway-tx-id",
    "status": "pending"
  }
}
```

### Verificar Status do Pagamento
```http
GET /api/payments/payment-uuid/status
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "paymentId": "payment-uuid",
  "status": "approved",
  "amount": 300.00,
  "approvedAt": "2024-01-15T10:30:00Z",
  "tickets": [
    {
      "id": "ticket-uuid-1",
      "code": "ABC123456",
      "categoryName": "Pista",
      "price": 150.00
    },
    {
      "id": "ticket-uuid-2", 
      "code": "ABC123457",
      "categoryName": "Pista",
      "price": 150.00
    }
  ]
}
```

## 4. Gerenciamento de Ingressos

### Meus Ingressos
```http
GET /api/tickets/my-tickets
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "tickets": [
    {
      "id": "ticket-uuid-1",
      "code": "ABC123456",
      "event": {
        "id": "event-uuid",
        "title": "Festival de Música Eletrônica",
        "date": "2024-06-15T20:00:00Z",
        "location": "Parque Ibirapuera"
      },
      "category": {
        "name": "Pista",
        "price": 150.00
      },
      "status": "ACTIVE",
      "purchasedAt": "2024-01-15T10:30:00Z",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

### Detalhes do Ingresso
```http
GET /api/tickets/ticket-uuid-1
Authorization: Bearer jwt-token
```

**Resposta:**
```json
{
  "id": "ticket-uuid-1",
  "code": "ABC123456",
  "event": {
    "id": "event-uuid",
    "title": "Festival de Música Eletrônica",
    "description": "O maior festival da cidade",
    "date": "2024-06-15T20:00:00Z",
    "location": "Parque Ibirapuera",
    "address": "Av. Pedro Álvares Cabral, s/n"
  },
  "category": {
    "name": "Pista",
    "description": "Acesso à pista principal",
    "price": 150.00,
    "benefits": ["Acesso à pista", "Barracas de comida"]
  },
  "status": "ACTIVE",
  "purchasedAt": "2024-01-15T10:30:00Z",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "checkInStatus": "NOT_CHECKED_IN"
}
```

## 5. Check-in no Evento

### Validar Ingresso (Scanner)
```http
POST /api/tickets/validate
Content-Type: application/json

{
  "ticketCode": "ABC123456",
  "scannerId": "scanner-uuid",
  "location": "Entrada Principal"
}
```

**Resposta:**
```json
{
  "valid": true,
  "ticket": {
    "id": "ticket-uuid-1",
    "code": "ABC123456",
    "eventTitle": "Festival de Música Eletrônica",
    "categoryName": "Pista",
    "holderName": "João Silva",
    "status": "ACTIVE",
    "checkInStatus": "NOT_CHECKED_IN"
  },
  "message": "Ingresso válido para check-in"
}
```

### Realizar Check-in
```http
POST /api/tickets/checkin
Content-Type: application/json

{
  "ticketCode": "ABC123456",
  "scannerId": "scanner-uuid",
  "location": "Entrada Principal",
  "timestamp": "2024-06-15T19:45:00Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "ticket": {
    "id": "ticket-uuid-1",
    "code": "ABC123456",
    "checkInStatus": "CHECKED_IN",
    "checkedInAt": "2024-06-15T19:45:00Z",
    "checkedInBy": "scanner-uuid"
  },
  "message": "Check-in realizado com sucesso"
}
```

## 6. APIs Administrativas

### Criar Evento
```http
POST /api/admin/events
Authorization: Bearer admin-jwt-token
Content-Type: application/json

{
  "title": "Novo Festival",
  "description": "Descrição do evento",
  "date": "2024-07-20T20:00:00Z",
  "location": "Local do evento",
  "address": "Endereço completo",
  "maxCapacity": 3000,
  "ticketCategories": [
    {
      "name": "Pista",
      "description": "Acesso à pista",
      "price": 100.00,
      "available": 2000,
      "maxPerUser": 4
    }
  ]
}
```

### Relatório de Check-ins
```http
GET /api/admin/events/event-uuid/checkins?date=2024-06-15
Authorization: Bearer admin-jwt-token
```

**Resposta:**
```json
{
  "event": {
    "id": "event-uuid",
    "title": "Festival de Música Eletrônica",
    "date": "2024-06-15T20:00:00Z"
  },
  "checkIns": [
    {
      "ticketCode": "ABC123456",
      "holderName": "João Silva",
      "categoryName": "Pista",
      "checkedInAt": "2024-06-15T19:45:00Z",
      "scannerLocation": "Entrada Principal"
    }
  ],
  "summary": {
    "totalTickets": 1200,
    "checkedIn": 850,
    "pending": 350,
    "checkInRate": 70.83
  }
}
```

## 7. Webhooks de Pagamento

### Webhook do Gateway
```http
POST /api/payments/webhook
Content-Type: application/json
X-Gateway-Signature: signature-hash

{
  "event": "payment.approved",
  "paymentId": "payment-uuid",
  "transactionId": "gateway-tx-id",
  "status": "approved",
  "amount": 300.00,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 8. Tratamento de Erros

### Exemplos de Respostas de Erro

**Erro de Validação:**
```json
{
  "statusCode": 400,
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email deve ter formato válido"
    }
  ]
}
```

**Erro de Autorização:**
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado"
}
```

**Erro de Negócio:**
```json
{
  "statusCode": 422,
  "message": "Ingressos esgotados para esta categoria"
}
```

**Erro de Ingresso Inválido:**
```json
{
  "statusCode": 400,
  "message": "Ingresso inválido ou já utilizado",
  "ticketCode": "ABC123456"
}
```
