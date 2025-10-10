# API Payments

Documentação automática dos endpoints do módulo payments.

**Gerado em:** 2025-10-10T23:37:23.380Z

## Endpoints

### GET /api/payments

**Listar todos os pagamentos**

**Parâmetros:**

- `userId` (query) - string
- `ticketId` (query) - string

**Respostas:**

- `200` - Lista de pagamentos obtida com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/payments"
```

---

### POST /api/payments

**Criar novo pagamento**

**Request Body:**

```json
{
  "ticketId": "string",
  "method": "PIX",
  "amount": 1,
  "installments": 1
}
```

**Respostas:**

- `201` - Pagamento criado com sucesso
- `401` - Não autorizado

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/payments" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### GET /api/payments/stats

**Obter estatísticas de pagamentos**

**Respostas:**

- `200` - Estatísticas obtidas com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/payments/stats"
```

---

### GET /api/payments/{id}

**Obter pagamento por ID**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Pagamento obtido com sucesso
- `404` - Pagamento não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/payments/{id}"
```

---

### PUT /api/payments/{id}/approve

**Aprovar pagamento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Pagamento aprovado com sucesso
- `401` - Não autorizado
- `404` - Pagamento não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/payments/{id}/approve" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/payments/{id}/reject

**Rejeitar pagamento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Pagamento rejeitado com sucesso
- `401` - Não autorizado
- `404` - Pagamento não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/payments/{id}/reject" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/payments/{id}/refund

**Reembolsar pagamento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Pagamento reembolsado com sucesso
- `401` - Não autorizado
- `404` - Pagamento não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/payments/{id}/refund" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

