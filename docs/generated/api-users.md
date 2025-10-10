# API Users

Documentação automática dos endpoints do módulo users.

**Gerado em:** 2025-10-10T23:37:23.379Z

## Endpoints

### GET /api/users

**Listar todos os usuários**

**Respostas:**

- `200` - Lista de usuários obtida com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/users"
```

---

### GET /api/users/{id}

**Obter usuário por ID**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Usuário obtido com sucesso
- `404` - Usuário não encontrado

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/users/{id}"
```

---

### PUT /api/users/{id}

**Atualizar usuário**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Usuário atualizado com sucesso
- `404` - Usuário não encontrado

**Exemplo de uso:**

```bash
curl -X PUT "http://localhost:3001/api/users/{id}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### DELETE /api/users/{id}

**Deletar usuário**

**Parâmetros:**

- `id` (path) - **Obrigatório** - string

**Respostas:**

- `200` - Usuário deletado com sucesso
- `404` - Usuário não encontrado

**Exemplo de uso:**

```bash
curl -X DELETE "http://localhost:3001/api/users/{id}"
```

---

