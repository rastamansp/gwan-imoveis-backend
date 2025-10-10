# API Events

Documentação automática dos endpoints do módulo events.

**Gerado em:** 2025-10-10T23:37:23.377Z

## Endpoints

### GET /api/events

**Listar todos os eventos**

**Parâmetros:**

- `category` (query) - string
- `city` (query) - string

**Respostas:**

- `200` - Lista de eventos obtida com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/events"
```

---

### POST /api/events

**Criar novo evento**

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

**Respostas:**

- `201` - Evento criado com sucesso
- `401` - Não autorizado

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/events" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### GET /api/events/{id}

**Obter evento por ID**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Evento obtido com sucesso
- `404` - Evento não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/events/{id}"
```

---

### PUT /api/events/{id}

**Atualizar evento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

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

**Respostas:**

- `200` - Evento atualizado com sucesso
- `401` - Não autorizado
- `404` - Evento não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/events/{id}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### DELETE /api/events/{id}

**Deletar evento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Evento deletado com sucesso
- `401` - Não autorizado
- `404` - Evento não encontrado

**Exemplo de uso:**

```bash
curl -X DELETE "http://localhost:3001/api/events/{id}"
```

---

### GET /api/events/{id}/ticket-categories

**Obter categorias de ingressos do evento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Categorias obtidas com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/events/{id}/ticket-categories"
```

---

### POST /api/events/{id}/ticket-categories

**Criar categoria de ingresso**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "price": 1,
  "maxQuantity": 1,
  "benefits": []
}
```

**Respostas:**

- `201` - Categoria criada com sucesso
- `401` - Não autorizado

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/events/{id}/ticket-categories" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### PUT /api/events/ticket-categories/{categoryId}

**Atualizar categoria de ingresso**

**Parâmetros:**

- `categoryId` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Categoria atualizada com sucesso
- `401` - Não autorizado
- `404` - Categoria não encontrada

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/events/ticket-categories/{categoryId}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

