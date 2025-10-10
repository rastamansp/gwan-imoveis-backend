# Documentação Completa da API

**Gwan Shop API** - API da plataforma de eventos e venda de ingressos

**Versão:** 1.0

**Gerado em:** 2025-10-10T23:37:23.381Z

## Estatísticas

- **Total de endpoints:** 33
- **Total de paths:** 25
- **Schemas definidos:** 9

## Lista de Endpoints

- **POST** `/api/auth/login` - Fazer login
- **POST** `/api/auth/register` - Registrar novo usuário
- **GET** `/api/auth/profile` - Obter perfil do usuário
- **GET** `/api/events` - Listar todos os eventos
- **POST** `/api/events` - Criar novo evento
- **GET** `/api/events/{id}` - Obter evento por ID
- **PUT** `/api/events/{id}` - Atualizar evento
- **DELETE** `/api/events/{id}` - Deletar evento
- **GET** `/api/events/{id}/ticket-categories` - Obter categorias de ingressos do evento
- **POST** `/api/events/{id}/ticket-categories` - Criar categoria de ingresso
- **PUT** `/api/events/ticket-categories/{categoryId}` - Atualizar categoria de ingresso
- **GET** `/api/tickets` - Listar todos os ingressos
- **POST** `/api/tickets` - Comprar ingresso
- **GET** `/api/tickets/stats` - Obter estatísticas de ingressos
- **GET** `/api/tickets/{id}` - Obter ingresso por ID
- **POST** `/api/tickets/{id}/validate` - Validar ingresso por QR Code
- **PUT** `/api/tickets/{id}/use` - Marcar ingresso como usado
- **PUT** `/api/tickets/{id}/transfer` - Transferir ingresso para outro usuário
- **PUT** `/api/tickets/{id}/cancel` - Cancelar ingresso
- **GET** `/api/users` - Listar todos os usuários
- **GET** `/api/users/{id}` - Obter usuário por ID
- **PUT** `/api/users/{id}` - Atualizar usuário
- **DELETE** `/api/users/{id}` - Deletar usuário
- **GET** `/api/payments` - Listar todos os pagamentos
- **POST** `/api/payments` - Criar novo pagamento
- **GET** `/api/payments/stats` - Obter estatísticas de pagamentos
- **GET** `/api/payments/{id}` - Obter pagamento por ID
- **PUT** `/api/payments/{id}/approve` - Aprovar pagamento
- **PUT** `/api/payments/{id}/reject` - Rejeitar pagamento
- **PUT** `/api/payments/{id}/refund` - Reembolsar pagamento
- **GET** `/api/admin/dashboard` - Obter estatísticas do dashboard
- **GET** `/api/admin/events/{id}/analytics` - Obter analytics de um evento
- **GET** `/api/admin/users/{id}/analytics` - Obter analytics de um usuário

## Schemas

### LoginDto

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "example": "usuario@email.com"
    },
    "password": {
      "type": "string",
      "example": "senha123"
    }
  },
  "required": [
    "email",
    "password"
  ]
}
```

### RegisterDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "example": "João Silva"
    },
    "email": {
      "type": "string",
      "example": "usuario@email.com"
    },
    "password": {
      "type": "string",
      "example": "senha123"
    },
    "phone": {
      "type": "string",
      "example": "11999999999"
    },
    "role": {
      "type": "string",
      "example": "USER"
    }
  },
  "required": [
    "name",
    "email",
    "password"
  ]
}
```

### CreateEventDto

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "example": "Festival de Música Eletrônica"
    },
    "description": {
      "type": "string",
      "example": "O maior festival de música eletrônica da cidade"
    },
    "date": {
      "type": "string",
      "example": "2024-06-15T20:00:00Z"
    },
    "location": {
      "type": "string",
      "example": "Parque da Cidade"
    },
    "address": {
      "type": "string",
      "example": "Av. das Flores, 123"
    },
    "city": {
      "type": "string",
      "example": "São Paulo"
    },
    "state": {
      "type": "string",
      "example": "SP"
    },
    "image": {
      "type": "string",
      "example": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
    },
    "category": {
      "type": "string",
      "example": "Música"
    },
    "maxCapacity": {
      "type": "number",
      "example": 5000
    }
  },
  "required": [
    "title",
    "description",
    "date",
    "location",
    "address",
    "city",
    "state",
    "image",
    "category"
  ]
}
```

### CreateTicketCategoryDto

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "example": "Pista"
    },
    "description": {
      "type": "string",
      "example": "Acesso à área principal do evento"
    },
    "price": {
      "type": "number",
      "example": 150
    },
    "maxQuantity": {
      "type": "number",
      "example": 3000
    },
    "benefits": {
      "example": [
        "Acesso à pista principal",
        "Banheiros",
        "Área de alimentação"
      ],
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "name",
    "description",
    "price",
    "maxQuantity"
  ]
}
```

### UpdateEventDto

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "example": "Festival de Música Eletrônica"
    },
    "description": {
      "type": "string",
      "example": "O maior festival de música eletrônica da cidade"
    },
    "date": {
      "type": "string",
      "example": "2024-06-15T20:00:00Z"
    },
    "location": {
      "type": "string",
      "example": "Parque da Cidade"
    },
    "address": {
      "type": "string",
      "example": "Av. das Flores, 123"
    },
    "city": {
      "type": "string",
      "example": "São Paulo"
    },
    "state": {
      "type": "string",
      "example": "SP"
    },
    "image": {
      "type": "string",
      "example": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800"
    },
    "category": {
      "type": "string",
      "example": "Música"
    },
    "maxCapacity": {
      "type": "number",
      "example": 5000
    }
  }
}
```

### CreateTicketDto

```json
{
  "type": "object",
  "properties": {
    "eventId": {
      "type": "string",
      "example": "1"
    },
    "categoryId": {
      "type": "string",
      "example": "1"
    },
    "quantity": {
      "type": "number",
      "example": 1
    }
  },
  "required": [
    "eventId",
    "categoryId",
    "quantity"
  ]
}
```

### ValidateTicketDto

```json
{
  "type": "object",
  "properties": {
    "qrCodeData": {
      "type": "string",
      "example": "TICKET_1_2024-06-15_20:00"
    }
  },
  "required": [
    "qrCodeData"
  ]
}
```

### TransferTicketDto

```json
{
  "type": "object",
  "properties": {
    "newUserId": {
      "type": "string",
      "example": "user-id-123"
    },
    "newUserName": {
      "type": "string",
      "example": "João Silva"
    },
    "newUserEmail": {
      "type": "string",
      "example": "joao@email.com"
    }
  },
  "required": [
    "newUserId",
    "newUserName",
    "newUserEmail"
  ]
}
```

### CreatePaymentDto

```json
{
  "type": "object",
  "properties": {
    "ticketId": {
      "type": "string",
      "example": "1"
    },
    "method": {
      "type": "string",
      "example": "PIX",
      "enum": [
        "PIX",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "DIGITAL_WALLET"
      ]
    },
    "amount": {
      "type": "number",
      "example": 150
    },
    "installments": {
      "type": "number",
      "example": 1
    }
  },
  "required": [
    "ticketId",
    "method",
    "amount"
  ]
}
```

