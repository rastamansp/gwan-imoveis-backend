# APIs - Application Programming Interfaces

Este diretório contém toda a documentação relacionada às APIs da plataforma.

## Documentação de APIs

### Visão Geral

- [Visão Geral da API](./overview.md) - Introdução e endpoints principais

### Guias Específicos

- [Administração de Imóveis](./properties-admin.md) - Guia completo para frontend
- [Fluxo Completo do Usuário](./user-journey-api-calls.md) - Jornada do usuário via API

## Acesso às APIs

### Swagger UI

Documentação interativa disponível em:
- **Desenvolvimento**: [http://localhost:3001/api](http://localhost:3001/api)
- **Produção**: [https://api-imoveis.gwan.com.br/api](https://api-imoveis.gwan.com.br/api)

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

#### Imóveis
- `GET /api/properties` - Listar imóveis
- `GET /api/properties/:id` - Obter imóvel
- `POST /api/properties` - Criar imóvel (autenticado)
- `PUT /api/properties/:id` - Atualizar imóvel (autenticado)
- `DELETE /api/properties/:id` - Deletar imóvel (autenticado)

#### Chat
- `POST /api/chat` - Enviar mensagem ao chatbot

#### MCP
- `GET /api/mcp/tools` - Listar tools disponíveis
- `POST /api/mcp/tools/call` - Executar tool

## Autenticação

A maioria dos endpoints requer autenticação JWT:

```http
Authorization: Bearer {token}
```

## Navegação

- [Voltar para Documentação Principal](../README.md)
- [Arquitetura de Aplicação](../togaf/application-architecture/)
- [Desenvolvimento](../development/setup.md)

