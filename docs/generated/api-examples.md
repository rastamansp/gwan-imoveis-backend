# Exemplos de Uso da API

Exemplos práticos de como usar a API.

**Gerado em:** 2025-10-10T23:37:23.383Z

## Auth

### Fazer login

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

### Registrar novo usuário

```bash
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "role": "string"
}
```

### Obter perfil do usuário

```bash
curl -X GET "http://localhost:3001/api/auth/profile"
```

## Events

### Listar todos os eventos

```bash
curl -X GET "http://localhost:3001/api/events"
```

### Criar novo evento

```bash
curl -X POST "http://localhost:3001/api/events" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**

```json
{
  "title": "string",
  "description": "string",
  "date": "string",
  "location": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "image": "string",
  "category": "string",
  "maxCapacity": 1
}
```

### Obter evento por ID

```bash
curl -X GET "http://localhost:3001/api/events/{id}"
```

## Tickets

### Listar todos os ingressos

```bash
curl -X GET "http://localhost:3001/api/tickets"
```

### Comprar ingresso

```bash
curl -X POST "http://localhost:3001/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**

```json
{
  "eventId": "string",
  "categoryId": "string",
  "quantity": 1
}
```

### Obter estatísticas de ingressos

```bash
curl -X GET "http://localhost:3001/api/tickets/stats"
```

## Users

### Listar todos os usuários

```bash
curl -X GET "http://localhost:3001/api/users"
```

### Obter usuário por ID

```bash
curl -X GET "http://localhost:3001/api/users/{id}"
```

### Atualizar usuário

```bash
curl -X PUT "http://localhost:3001/api/users/{id}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Payments

### Listar todos os pagamentos

```bash
curl -X GET "http://localhost:3001/api/payments"
```

### Criar novo pagamento

```bash
curl -X POST "http://localhost:3001/api/payments" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body:**

```json
{
  "ticketId": "string",
  "method": "PIX",
  "amount": 1,
  "installments": 1
}
```

### Obter estatísticas de pagamentos

```bash
curl -X GET "http://localhost:3001/api/payments/stats"
```

## Admin

### Obter estatísticas do dashboard

```bash
curl -X GET "http://localhost:3001/api/admin/dashboard"
```

### Obter analytics de um evento

```bash
curl -X GET "http://localhost:3001/api/admin/events/{id}/analytics"
```

### Obter analytics de um usuário

```bash
curl -X GET "http://localhost:3001/api/admin/users/{id}/analytics"
```

