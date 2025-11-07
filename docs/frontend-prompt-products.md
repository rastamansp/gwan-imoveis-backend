# Prompt para Frontend - Sistema de Cadastro de Produtos

## Objetivo
Criar interface para organizadores de eventos cadastrarem e gerenciarem produtos (bebidas e alimentos) que serão vendidos em seus eventos.

## Endpoints da API

**Base URL:** `http://localhost:3001/api`

### 1. Criar Produto
```
POST /products
Headers: Authorization: Bearer {token}
Body: {
  eventId: string (UUID),
  name: string (obrigatório),
  description?: string,
  price: number (mínimo 0.01),
  category: "BEBIDA" | "ALIMENTO",
  image?: string (URL),
  isActive?: boolean (padrão: true)
}
```

### 2. Listar Produtos do Evento
```
GET /products/event/{eventId}?activeOnly=true
Retorna: Array de produtos
```

### 3. Obter Produto
```
GET /products/{id}
Retorna: Objeto produto
```

### 4. Atualizar Produto
```
PUT /products/{id}
Headers: Authorization: Bearer {token}
Body: { name?, description?, price?, category?, image?, isActive? }
```

### 5. Deletar Produto
```
DELETE /products/{id}
Headers: Authorization: Bearer {token}
```

## Páginas Necessárias

### 1. Lista de Produtos (`/events/{eventId}/products`)
- Grid/lista de cards mostrando produtos
- Cada card: nome, categoria (BEBIDA/ALIMENTO), preço, status (ativo/inativo)
- Botão "Adicionar Produto" (só aparece se for organizador)
- Botões: Editar, Ativar/Desativar, Deletar
- Filtros: por categoria, ativos/inativos
- Busca por nome

### 2. Formulário de Cadastro/Edição (`/events/{eventId}/products/new` ou `/edit/{id}`)
- Campos:
  - Nome* (texto)
  - Descrição (textarea)
  - Preço* (número, mínimo 0.01)
  - Categoria* (select: BEBIDA ou ALIMENTO)
  - URL da Imagem (texto)
  - Status Ativo (checkbox)
- Validação em tempo real
- Botões: Salvar, Cancelar
- Feedback de sucesso/erro

## Regras Importantes

1. **Permissões:** Apenas organizador do evento pode criar/editar/deletar produtos
2. **Validações:** Nome e preço obrigatórios, preço mínimo 0.01
3. **Categorias:** Apenas "BEBIDA" ou "ALIMENTO"
4. **Erros:** Tratar 401 (login), 403 (sem permissão), 404 (não encontrado), 400 (validação)

## Estrutura de Dados

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
  createdAt: string;
  updatedAt: string;
}
```

## Fluxos

1. **Criar:** Lista → Adicionar → Formulário → Salvar → Volta para lista
2. **Editar:** Lista → Editar → Formulário preenchido → Salvar → Volta para lista
3. **Deletar:** Lista → Deletar → Confirmar → Remove da lista
4. **Ativar/Desativar:** Lista → Toggle status → Atualiza visualmente

## UX Sugestões

- Loading states durante requisições
- Toast/notifications para feedback
- Confirmação antes de deletar
- Agrupar produtos por categoria
- Layout responsivo (mobile-friendly)
- Ícones diferentes para BEBIDA (🍺) e ALIMENTO (🍔)

