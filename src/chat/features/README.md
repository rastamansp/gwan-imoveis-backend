# Features BDD - Chat

Este diretório contém as features BDD (Behavior-Driven Development) para testes do módulo de Chat.

## Estrutura

- **`list-properties-chat.feature`** - Testes de listagem de imóveis via chat
- **`search-properties-chat.feature`** - Testes de busca de imóveis com filtros via chat
- **`get-property-details-chat.feature`** - Testes de obtenção de detalhes de imóvel via chat
- **`chat-session.feature`** - Testes de sessão e contexto do chat

## Executar Testes

```bash
# Executar todos os testes BDD (incluindo chat)
npm run test:bdd

# Executar apenas features do chat
npm run test:bdd -- src/chat/features/*.feature

# Executar em modo watch
npm run test:bdd:watch
```

## Tags Disponíveis

- `@smoke` - Testes críticos de smoke
- `@chat` - Testes relacionados ao chat
- `@list` - Testes de listagem
- `@search` - Testes de busca
- `@get` - Testes de obtenção de dados
- `@session` - Testes de sessão
- `@city` - Testes por cidade
- `@type` - Testes por tipo de imóvel
- `@purpose` - Testes por finalidade
- `@price` - Testes por preço
- `@amenities` - Testes por comodidades
- `@combined` - Testes com filtros combinados
- `@negative` - Testes negativos (erros esperados)

## Exemplos de Uso

### Listar imóveis
```gherkin
Quando envio a mensagem "Liste imoveis em Sao Sebastiao"
Então devo receber uma resposta
E a resposta deve usar a ferramenta "list_properties"
```

### Buscar com filtros
```gherkin
Quando envio a mensagem "Busque casas com piscina"
Então devo receber uma resposta
E a resposta deve usar a ferramenta "list_properties"
```

### Obter detalhes
```gherkin
Quando envio a mensagem "Mostre os detalhes do imovel {id}"
Então devo receber uma resposta
E a resposta deve usar a ferramenta "get_property_by_id"
```

