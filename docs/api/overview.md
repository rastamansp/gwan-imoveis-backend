# 📡 Documentação da API

## Visão Geral

A API do Gwan Events Backend é uma API RESTful construída com NestJS que fornece endpoints para gerenciamento de eventos, usuários, ingressos e pagamentos.

## Base URL

```
http://localhost:3001/api
```

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Inclua o token no header `Authorization`:

```
Authorization: Bearer <seu-jwt-token>
```

## Formato de Resposta

### Sucesso

```json
{
  "data": {
    "id": "1",
    "title": "Festival de Música",
    "description": "Descrição do evento",
    "date": "2024-06-15T20:00:00.000Z",
    "location": "Parque da Cidade",
    "status": "ACTIVE"
  }
}
```

### Erro

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/events"
}
```

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro interno |

## Endpoints Disponíveis

### 🔐 Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login do usuário |
| POST | `/auth/register` | Registro de usuário |
| GET | `/auth/profile` | Perfil do usuário |

### 👥 Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/users` | Listar usuários |
| GET | `/users/:id` | Obter usuário por ID |
| PUT | `/users/:id` | Atualizar usuário |
| DELETE | `/users/:id` | Deletar usuário |

### 🎉 Eventos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/events` | Listar eventos |
| GET | `/events/:id` | Obter evento por ID |
| POST | `/events` | Criar evento |
| PUT | `/events/:id` | Atualizar evento |
| DELETE | `/events/:id` | Deletar evento |
| GET | `/events/:id/ticket-categories` | Categorias de ingressos |

### 🎫 Ingressos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/tickets` | Listar ingressos |
| GET | `/tickets/:id` | Obter ingresso por ID |
| POST | `/tickets` | Comprar ingresso |
| PUT | `/tickets/:id/use` | Usar ingresso |
| PUT | `/tickets/:id/transfer` | Transferir ingresso |
| PUT | `/tickets/:id/cancel` | Cancelar ingresso |
| POST | `/tickets/:id/validate` | Validar ingresso |

### 💳 Pagamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/payments` | Listar pagamentos |
| GET | `/payments/:id` | Obter pagamento por ID |
| POST | `/payments` | Processar pagamento |
| PUT | `/payments/:id/approve` | Aprovar pagamento |
| PUT | `/payments/:id/reject` | Rejeitar pagamento |
| PUT | `/payments/:id/refund` | Reembolsar pagamento |

### 👨‍💼 Administração

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/dashboard` | Dashboard administrativo |
| GET | `/admin/events/:id/analytics` | Analytics do evento |
| GET | `/admin/users/:id/analytics` | Analytics do usuário |

## Exemplos de Uso

### 1. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "email": "usuario@example.com",
    "name": "João Silva"
  }
}
```

### 2. Listar Eventos

```bash
curl -X GET http://localhost:3001/api/events \
  -H "Authorization: Bearer <token>"
```

**Resposta:**
```json
[
  {
    "id": "1",
    "title": "Festival de Música Eletrônica",
    "description": "O maior festival de música eletrônica da cidade",
    "date": "2024-06-15T20:00:00.000Z",
    "location": "Parque da Cidade",
    "address": "Av. das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "category": "Música",
    "status": "ACTIVE",
    "maxCapacity": 5000,
    "soldTickets": 1200
  }
]
```

### 3. Criar Evento

```bash
curl -X POST http://localhost:3001/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop de Programação",
    "description": "Aprenda as melhores práticas de desenvolvimento",
    "date": "2024-05-20T09:00:00.000Z",
    "location": "Centro de Convenções",
    "address": "Rua da Tecnologia, 456",
    "city": "Rio de Janeiro",
    "state": "RJ",
    "category": "Educação",
    "maxCapacity": 200
  }'
```

### 4. Comprar Ingresso

```bash
curl -X POST http://localhost:3001/api/tickets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "1",
    "categoryId": "1",
    "quantity": 2
  }'
```

## Paginação

Para endpoints que retornam listas, use os parâmetros de query:

```
GET /api/events?page=1&limit=10&sort=date&order=DESC
```

**Parâmetros:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 100)
- `sort`: Campo para ordenação
- `order`: Direção da ordenação (ASC ou DESC)

**Resposta:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtros

### Eventos

```
GET /api/events?category=Música&city=São Paulo&status=ACTIVE
```

**Filtros disponíveis:**
- `category`: Categoria do evento
- `city`: Cidade do evento
- `state`: Estado do evento
- `status`: Status do evento (ACTIVE, INACTIVE, SOLD_OUT)
- `dateFrom`: Data inicial
- `dateTo`: Data final

### Ingressos

```
GET /api/tickets?eventId=1&status=PENDING&userId=1
```

**Filtros disponíveis:**
- `eventId`: ID do evento
- `userId`: ID do usuário
- `status`: Status do ingresso (PENDING, CONFIRMED, USED, CANCELLED)
- `categoryId`: ID da categoria

## Validação de Dados

A API utiliza class-validator para validação de dados. Exemplo de erro de validação:

```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "date must be a valid ISO 8601 date string",
    "maxCapacity must be a positive number"
  ],
  "error": "Bad Request"
}
```

## Rate Limiting

A API implementa rate limiting para prevenir abuso:

- **Limite**: 100 requests por minuto por IP
- **Headers de resposta**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## CORS

A API está configurada para aceitar requests de:

**Desenvolvimento:**
- `http://localhost:3000`
- `http://localhost:5173`

**Produção:**
- `https://events.gwan.com.br`
- `https://www.events.gwan.com.br`

## Documentação Interativa

Acesse a documentação Swagger em:
```
http://localhost:3001/api
```

## Próximos Passos

1. Implementar endpoints específicos conforme necessário
2. Adicionar documentação detalhada para cada módulo
3. Criar exemplos de uso para cada endpoint
