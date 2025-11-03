# Módulo de Artistas

Este módulo contém toda a lógica relacionada à gestão de artistas no sistema.

## Estrutura

```
artists/
├── artists.controller.ts     # Controller REST para endpoints de artistas
├── artists.http              # Arquivos de teste HTTP para a API
├── artists.module.ts         # Módulo NestJS
├── features/                 # Testes BDD (Cucumber)
│   ├── artists.feature       # Cenários principais de artistas
│   └── artists-integration.feature  # Cenários de integração
└── steps/                    # Step definitions para testes BDD
    └── artists-steps.ts      # Steps específicos para artistas
```

## APIs Disponíveis

Consulte o Swagger em `http://localhost:3001/api` para documentação completa das APIs.

### Endpoints Principais

- `GET /api/artists` - Listar artistas
- `GET /api/artists/:id` - Obter detalhes de um artista
- `POST /api/artists` - Criar artista (requer autenticação de organizador/admin)
- `PUT /api/artists/:id` - Atualizar artista (requer autenticação de organizador/admin)
- `DELETE /api/artists/:id` - Deletar artista (requer autenticação de organizador/admin)
- `GET /api/artists/search` - Buscar artistas por query
- `GET /api/artists/search/rag` - Busca semântica (RAG)
- `GET /api/events/:eventId/artists` - Listar artistas vinculados a um evento
- `POST /api/events/:eventId/artists` - Vincular artista a evento (requer autenticação)
- `DELETE /api/events/:eventId/artists/:artistId` - Desvincular artista de evento (requer autenticação)

## Testes BDD

Este módulo possui testes BDD usando Cucumber para validar o comportamento do chatbot ao interagir com artistas.

### Executar Testes BDD

```bash
# Executar todos os testes BDD
npm run test:bdd

# Executar apenas testes de artistas
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @artists

# Executar apenas testes smoke de artistas
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @artists --tags @smoke
```

### Features Disponíveis

#### artists.feature
Cenários principais para buscar e consultar artistas:
- Listar artistas
- Buscar por ID, nome artístico, nome real
- Busca semântica (RAG)
- Obter eventos vinculados
- Buscar por rede social
- Casos negativos (UUID inválido, artista não encontrado)
- Buscar com informações de redes sociais

#### artists-integration.feature
Cenários de integração que combinam múltiplas ferramentas:
- Fluxo: buscar artista e ver eventos vinculados
- Múltiplas ferramentas em uma única conversa

### Step Definitions

Os steps estão organizados em:
- `steps/artists-steps.ts` - Steps específicos para artistas
- `test/bdd/steps/common-steps.ts` - Steps compartilhados (compartilhado entre módulos)
- `test/bdd/steps/chat-steps.ts` - Steps do chatbot (compartilhado)

## Dados do Artista

Um artista contém:
- **Nome artístico**: Nome público do artista
- **Nome real**: Nome completo do artista
- **Data de nascimento**: Data de nascimento
- **Biografia**: Descrição do artista
- **Redes sociais**: Instagram, YouTube, X (Twitter), Spotify, TikTok
- **Site**: URL do site oficial
- **Imagem**: URL da imagem do artista
- **Eventos vinculados**: Relacionamento many-to-many com eventos

## Relacionamentos

Este módulo se relaciona com:
- **Eventos**: Artistas podem estar vinculados a múltiplos eventos (relacionamento many-to-many)

## Documentação Adicional

- [API de Artistas](../docs/api/overview.md)
- [Testes BDD](../test/bdd/README.md)

