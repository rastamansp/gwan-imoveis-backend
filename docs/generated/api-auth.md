# API Auth

Documentação automática dos endpoints do módulo auth.

**Gerado em:** 2025-10-10T23:37:23.375Z

## Endpoints

### POST /api/auth/login

**Fazer login**

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Respostas:**

- `200` - Login realizado com sucesso
- `401` - Credenciais inválidas

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### POST /api/auth/register

**Registrar novo usuário**

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

**Respostas:**

- `201` - Usuário criado com sucesso
- `400` - Dados inválidos

**Exemplo de uso:**

```bash
curl -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### GET /api/auth/profile

**Obter perfil do usuário**

**Respostas:**

- `200` - Perfil obtido com sucesso

**Exemplo de uso:**

```bash
curl -X GET "http://localhost:3001/api/auth/profile"
```

---

