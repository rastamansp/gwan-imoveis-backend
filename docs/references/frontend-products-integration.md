# Especificação Frontend - Sistema de Produtos para Eventos

## 📋 Contexto

Sistema para gerenciar produtos (bebidas e alimentos) que podem ser vendidos em eventos. Apenas organizadores de eventos podem cadastrar produtos para seus eventos. Os produtos são específicos por evento e podem ser comprados pelos clientes usando créditos.

## 🔐 Autenticação

Todos os endpoints de criação, atualização e exclusão de produtos requerem autenticação JWT via Bearer Token no header:
```
Authorization: Bearer {token}
```

**Importante:** Apenas o organizador do evento pode criar, editar ou deletar produtos do seu evento.

## 📡 Endpoints Disponíveis

### Base URL
```
http://localhost:3001/api
```

### 1. Criar Produto
**POST** `/products`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "eventId": "uuid-do-evento",
  "name": "Cerveja Artesanal",
  "description": "Cerveja artesanal premium (opcional)",
  "price": 15.50,
  "category": "BEBIDA" | "ALIMENTO",
  "image": "https://example.com/image.jpg" (opcional),
  "isActive": true (opcional, padrão: true)
}
```

**Resposta (201):**
```json
{
  "id": "uuid-do-produto",
  "eventId": "uuid-do-evento",
  "name": "Cerveja Artesanal",
  "description": "Cerveja artesanal premium",
  "price": 15.50,
  "category": "BEBIDA",
  "image": "https://example.com/image.jpg",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Erros:**
- `401` - Não autorizado (token inválido ou ausente)
- `403` - Apenas organizador do evento pode criar produtos
- `400` - Dados inválidos (validação falhou)

### 2. Listar Produtos do Evento
**GET** `/products/event/{eventId}?activeOnly=true`

**Query Parameters:**
- `activeOnly` (opcional): `true` ou `false` - padrão: `true`

**Resposta (200):**
```json
[
  {
    "id": "uuid-do-produto",
    "eventId": "uuid-do-evento",
    "name": "Cerveja Artesanal",
    "description": "Cerveja artesanal premium",
    "price": 15.50,
    "category": "BEBIDA",
    "image": "https://example.com/image.jpg",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Obter Produto por ID
**GET** `/products/{id}`

**Resposta (200):**
```json
{
  "id": "uuid-do-produto",
  "eventId": "uuid-do-evento",
  "name": "Cerveja Artesanal",
  "description": "Cerveja artesanal premium",
  "price": 15.50,
  "category": "BEBIDA",
  "image": "https://example.com/image.jpg",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Erros:**
- `404` - Produto não encontrado

### 4. Atualizar Produto
**PUT** `/products/{id}`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body (todos os campos são opcionais):**
```json
{
  "name": "Cerveja Artesanal Premium",
  "description": "Nova descrição",
  "price": 18.00,
  "category": "BEBIDA",
  "image": "https://example.com/new-image.jpg",
  "isActive": true
}
```

**Resposta (200):** Mesmo formato do GET

**Erros:**
- `401` - Não autorizado
- `403` - Apenas organizador do evento pode atualizar
- `404` - Produto não encontrado

### 5. Deletar Produto
**DELETE** `/products/{id}`

**Headers:**
- `Authorization: Bearer {token}`

**Resposta (204):** Sem conteúdo

**Erros:**
- `401` - Não autorizado
- `403` - Apenas organizador do evento pode deletar
- `404` - Produto não encontrado

## 📊 Estrutura de Dados

### ProductCategory (Enum)
```typescript
enum ProductCategory {
  BEBIDA = 'BEBIDA',
  ALIMENTO = 'ALIMENTO'
}
```

### Product (Interface TypeScript)
```typescript
interface Product {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  category: 'BEBIDA' | 'ALIMENTO';
  image: string | null;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

## 🎨 Páginas Necessárias

### 1. Lista de Produtos do Evento
**Rota:** `/events/{eventId}/products` ou `/admin/events/{eventId}/products`

**Funcionalidades:**
- Listar todos os produtos do evento (com filtro para ativos/inativos)
- Exibir cards ou tabela com: nome, categoria, preço, status (ativo/inativo)
- Botão "Adicionar Produto" (apenas se for organizador)
- Botões de ação: Editar, Ativar/Desativar, Deletar
- Filtro por categoria (BEBIDA/ALIMENTO)
- Busca por nome

**Layout Sugerido:**
```
┌─────────────────────────────────────────┐
│  [← Voltar]  Produtos do Evento        │
│                                         │
│  [Filtros: Ativos ▼] [Categoria ▼]    │
│  [Buscar...]              [+ Adicionar]│
│                                         │
│  ┌──────────┐  ┌──────────┐          │
│  │ 🍺 Cerveja│  │ 🍔 Hambúrguer│      │
│  │ R$ 15,50 │  │ R$ 25,00 │          │
│  │ [Editar] │  │ [Editar] │          │
│  └──────────┘  └──────────┘          │
└─────────────────────────────────────────┘
```

### 2. Formulário de Cadastro/Edição de Produto
**Rota:** `/events/{eventId}/products/new` ou `/events/{eventId}/products/{id}/edit`

**Funcionalidades:**
- Formulário com campos:
  - **Nome** (obrigatório, texto)
  - **Descrição** (opcional, textarea)
  - **Preço** (obrigatório, número decimal, mínimo 0.01)
  - **Categoria** (obrigatório, select: BEBIDA ou ALIMENTO)
  - **Imagem** (opcional, URL ou upload)
  - **Status Ativo** (checkbox, padrão: true)
- Validação em tempo real
- Botões: Salvar, Cancelar
- Feedback de sucesso/erro

**Layout Sugerido:**
```
┌─────────────────────────────────────────┐
│  [← Voltar]  Novo Produto              │
│                                         │
│  Nome *                                 │
│  [___________________________]          │
│                                         │
│  Descrição                              │
│  [___________________________]         │
│  [___________________________]         │
│                                         │
│  Preço *                                │
│  R$ [____] (mínimo: R$ 0,01)           │
│                                         │
│  Categoria *                            │
│  [BEBIDA ▼]                            │
│                                         │
│  URL da Imagem                          │
│  [___________________________]         │
│                                         │
│  ☑ Produto ativo                        │
│                                         │
│  [Cancelar]  [Salvar Produto]          │
└─────────────────────────────────────────┘
```

### 3. Visualização de Produto (Opcional)
**Rota:** `/events/{eventId}/products/{id}`

**Funcionalidades:**
- Exibir detalhes completos do produto
- Botões de ação: Editar, Deletar
- Histórico de alterações (se necessário)

## ✅ Validações Frontend

### Campos Obrigatórios
- `eventId`: UUID válido
- `name`: String não vazia, máximo 255 caracteres
- `price`: Número positivo, mínimo 0.01
- `category`: Deve ser "BEBIDA" ou "ALIMENTO"

### Campos Opcionais
- `description`: String, máximo 1000 caracteres
- `image`: URL válida ou string vazia
- `isActive`: Boolean, padrão `true`

### Validações Adicionais
- Preço deve ter no máximo 2 casas decimais
- URL da imagem deve ser válida (se fornecida)
- Nome não pode conter apenas espaços

## 🔄 Fluxos de Trabalho

### Fluxo 1: Criar Novo Produto
1. Organizador acessa lista de produtos do evento
2. Clica em "Adicionar Produto"
3. Preenche formulário
4. Clica em "Salvar"
5. Sistema valida dados
6. Se válido: envia POST `/products`
7. Se sucesso: redireciona para lista com mensagem de sucesso
8. Se erro: exibe mensagem de erro

### Fluxo 2: Editar Produto
1. Organizador acessa lista de produtos
2. Clica em "Editar" em um produto
3. Sistema carrega dados via GET `/products/{id}`
4. Preenche formulário com dados existentes
5. Modifica campos desejados
6. Clica em "Salvar"
7. Sistema envia PUT `/products/{id}`
8. Se sucesso: redireciona para lista
9. Se erro: exibe mensagem de erro

### Fluxo 3: Deletar Produto
1. Organizador acessa lista de produtos
2. Clica em "Deletar" em um produto
3. Sistema exibe confirmação: "Tem certeza que deseja deletar?"
4. Se confirmar: envia DELETE `/products/{id}`
5. Se sucesso: remove item da lista ou recarrega
6. Se erro: exibe mensagem de erro

### Fluxo 4: Ativar/Desativar Produto
1. Organizador acessa lista de produtos
2. Clica em toggle de status (ativo/inativo)
3. Sistema envia PUT `/products/{id}` com `isActive` atualizado
4. Se sucesso: atualiza visualização
5. Se erro: reverte toggle e exibe mensagem

## 🎯 Regras de Negócio

1. **Permissões:**
   - Apenas organizador do evento pode criar/editar/deletar produtos
   - Se usuário não for organizador, retornará erro 403
   - Frontend deve verificar permissões antes de exibir botões de ação

2. **Validação de Evento:**
   - O `eventId` deve ser válido e o evento deve existir
   - O usuário deve ser organizador desse evento

3. **Status do Produto:**
   - Produtos inativos não aparecem na lista pública (para clientes)
   - Organizador pode ver todos os produtos (ativos e inativos)

4. **Categorias:**
   - Apenas duas categorias: BEBIDA e ALIMENTO
   - Use ícones ou cores diferentes para cada categoria

## 💡 Sugestões de UX/UI

1. **Feedback Visual:**
   - Loading states durante requisições
   - Mensagens de sucesso (toast/notification)
   - Mensagens de erro claras e específicas
   - Confirmação antes de deletar

2. **Organização:**
   - Agrupar produtos por categoria
   - Ordenação: nome, preço, data de criação
   - Paginação se houver muitos produtos

3. **Acessibilidade:**
   - Labels descritivos nos campos
   - Mensagens de erro associadas aos campos
   - Navegação por teclado
   - Contraste adequado

4. **Responsividade:**
   - Layout adaptável para mobile
   - Cards empilhados em telas pequenas
   - Formulário em coluna única em mobile

## 📝 Exemplo de Código TypeScript

```typescript
// types/product.ts
export enum ProductCategory {
  BEBIDA = 'BEBIDA',
  ALIMENTO = 'ALIMENTO'
}

export interface Product {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  category: ProductCategory;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  category: ProductCategory;
  image?: string;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  category?: ProductCategory;
  image?: string;
  isActive?: boolean;
}

// services/product.service.ts
export class ProductService {
  private baseUrl = 'http://localhost:3001/api';

  async createProduct(data: CreateProductDto, token: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar produto');
    }
    
    return response.json();
  }

  async getEventProducts(eventId: string, activeOnly: boolean = true): Promise<Product[]> {
    const response = await fetch(
      `${this.baseUrl}/products/event/${eventId}?activeOnly=${activeOnly}`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    
    return response.json();
  }

  async updateProduct(id: string, data: UpdateProductDto, token: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar produto');
    }
    
    return response.json();
  }

  async deleteProduct(id: string, token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar produto');
    }
  }
}
```

## 🚨 Tratamento de Erros

### Erro 401 (Não Autorizado)
- Redirecionar para login
- Exibir mensagem: "Sua sessão expirou. Faça login novamente."

### Erro 403 (Sem Permissão)
- Exibir mensagem: "Você não tem permissão para realizar esta ação."
- Ocultar botões de ação se o usuário não for organizador

### Erro 404 (Não Encontrado)
- Exibir mensagem: "Produto não encontrado."
- Redirecionar para lista de produtos

### Erro 400 (Dados Inválidos)
- Exibir erros de validação específicos por campo
- Destacar campos com erro

## 📌 Checklist de Implementação

- [ ] Criar tipos/interfaces TypeScript
- [ ] Criar serviço de API para produtos
- [ ] Criar página de lista de produtos
- [ ] Criar formulário de cadastro
- [ ] Criar formulário de edição
- [ ] Implementar validações frontend
- [ ] Implementar tratamento de erros
- [ ] Adicionar loading states
- [ ] Adicionar mensagens de feedback
- [ ] Implementar confirmação de exclusão
- [ ] Adicionar filtros e busca
- [ ] Testar fluxos completos
- [ ] Verificar responsividade
- [ ] Verificar acessibilidade

---

**Nota:** Esta especificação está baseada nos endpoints implementados no backend. Qualquer dúvida sobre comportamento específico, consulte a documentação Swagger em `/api-docs` ou teste os endpoints diretamente.

