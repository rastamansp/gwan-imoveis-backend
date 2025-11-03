# Módulo de Eventos

Este módulo contém toda a lógica relacionada à gestão de eventos no sistema.

## Estrutura

```
events/
├── events.controller.ts      # Controller REST para endpoints de eventos
├── events.http               # Arquivos de teste HTTP para a API
├── events.module.ts          # Módulo NestJS
├── features/                 # Testes BDD (Cucumber)
│   ├── events.feature        # Cenários principais de eventos
│   └── events-integration.feature  # Cenários de integração
└── steps/                    # Step definitions para testes BDD
    └── events-steps.ts       # Steps específicos para eventos
```

## APIs Disponíveis

Consulte o Swagger em `http://localhost:3001/api` para documentação completa das APIs.

### Endpoints Principais

- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obter detalhes de um evento
- `POST /api/events` - Criar evento (requer autenticação)
- `PUT /api/events/:id` - Atualizar evento (requer autenticação)
- `DELETE /api/events/:id` - Deletar evento (requer autenticação)
- `GET /api/events/search` - Buscar eventos por query
- `GET /api/events/search/rag` - Busca semântica (RAG)

## Testes BDD

Este módulo possui testes BDD usando Cucumber para validar o comportamento do chatbot ao interagir com eventos.

### Executar Testes BDD

```bash
# Executar todos os testes BDD
npm run test:bdd

# Executar apenas testes de eventos
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @events

# Executar apenas testes smoke de eventos
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @events --tags @smoke
```

### Features Disponíveis

#### events.feature
Cenários principais para buscar e consultar eventos:
- Listar eventos
- Buscar por ID, código, nome
- Busca semântica (RAG)
- Obter preços de ingressos
- Buscar por categoria e cidade
- Casos negativos (UUID inválido, evento não encontrado)

#### events-integration.feature
Cenários de integração que combinam múltiplas ferramentas:
- Fluxo completo: listar eventos, buscar detalhes e preços
- Buscar eventos e artistas relacionados
- Busca semântica combinada com busca por query

### Step Definitions

Os steps estão organizados em:
- `steps/events-steps.ts` - Steps específicos para eventos
- `test/bdd/steps/common-steps.ts` - Steps compartilhados (compartilhado entre módulos)
- `test/bdd/steps/chat-steps.ts` - Steps do chatbot (compartilhado)

## Relacionamentos

Este módulo se relaciona com:
- **Artistas**: Eventos podem ter múltiplos artistas vinculados
- **Ingressos**: Eventos possuem categorias de ingressos
- **Usuários**: Eventos são criados por organizadores

## Documentação Adicional

- [API de Eventos](../docs/api/overview.md)
- [Testes BDD](../test/bdd/README.md)

