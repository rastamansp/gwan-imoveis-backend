# API Admin

Documentação automática dos endpoints do módulo admin.

**Gerado em:** 2025-10-10T23:37:23.380Z

## Endpoints

### GET /api/admin/dashboard

**Obter estatísticas do dashboard**

**Respostas:**

- `200` - Estatísticas obtidas com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/admin/dashboard"
```

---

### GET /api/admin/events/{id}/analytics

**Obter analytics de um evento**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Analytics obtidas com sucesso
- `404` - Evento não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/admin/events/{id}/analytics"
```

---

### GET /api/admin/users/{id}/analytics

**Obter analytics de um usuário**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Analytics obtidas com sucesso
- `404` - Usuário não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/admin/users/{id}/analytics"
```

---

