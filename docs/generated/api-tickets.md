# API Tickets

Documentação automática dos endpoints do módulo tickets.

**Gerado em:** 2025-10-10T23:37:23.378Z

## Endpoints

### GET /api/tickets

**Listar todos os ingressos**

**Parâmetros:**

- `userId` (query) - string
- `eventId` (query) - string

**Respostas:**

- `200` - Lista de ingressos obtida com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/tickets"
```

---

### POST /api/tickets

**Comprar ingresso**

**Request Body:**

```json
{
  "eventId": "string",
  "categoryId": "string",
  "quantity": 1
}
```

**Respostas:**

- `201` - Ingresso comprado com sucesso
- `401` - Não autorizado

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### GET /api/tickets/stats

**Obter estatísticas de ingressos**

**Parâmetros:**

- `eventId` (query) - string

**Respostas:**

- `200` - Estatísticas obtidas com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/tickets/stats"
```

---

### GET /api/tickets/{id}

**Obter ingresso por ID**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Ingresso obtido com sucesso
- `404` - Ingresso não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/tickets/{id}"
```

---

### POST /api/tickets/{id}/validate

**Validar ingresso por QR Code**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Request Body:**

```json
{
  "qrCodeData": "string"
}
```

**Respostas:**

- `200` - Validação realizada com sucesso
- `400` - Ingresso inválido

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/tickets/{id}/validate" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/tickets/{id}/use

**Marcar ingresso como usado**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Ingresso marcado como usado
- `401` - Não autorizado
- `404` - Ingresso não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/tickets/{id}/use" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/tickets/{id}/transfer

**Transferir ingresso para outro usuário**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Request Body:**

```json
{
  "newUserId": "string",
  "newUserName": "string",
  "newUserEmail": "string"
}
```

**Respostas:**

- `200` - Ingresso transferido com sucesso
- `401` - Não autorizado
- `404` - Ingresso não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/tickets/{id}/transfer" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/tickets/{id}/cancel

**Cancelar ingresso**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Ingresso cancelado com sucesso
- `401` - Não autorizado
- `404` - Ingresso não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/tickets/{id}/cancel" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

