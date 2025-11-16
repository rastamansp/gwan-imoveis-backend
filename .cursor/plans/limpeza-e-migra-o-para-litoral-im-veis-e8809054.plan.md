<!-- e8809054-2138-42c2-a91e-8668f24be219 d93765ce-9e0f-450a-aeaa-c5abac17f0f9 -->
# API de Administração de Imóveis com MCP Decorators e Embedding para RAG

## Objetivo

Criar API completa para cadastro e gerenciamento de imóveis, seguindo os padrões de Clean Architecture do projeto, com geração automática de embeddings e decorators MCP nos métodos de consulta para integração com RAG.

## Alterações Necessárias

### 1. Atualizar UserRole Enum

- **Arquivo**: `src/shared/domain/value-objects/user-role.enum.ts`
- Substituir `ORGANIZER` por `CORRETOR`
- Atualizar referências em `user.entity.ts` e métodos relacionados

### 2. Criar Enum de Tipo de Imóvel

- **Arquivo**: `src/shared/domain/value-objects/property-type.enum.ts`
- Tipos: CASA, APARTAMENTO, CHALE, SALA_COMERC