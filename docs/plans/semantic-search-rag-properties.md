# Plano: Busca Semântica de Imóveis (RAG) — `properties`

**Status:** Aguardando validação
**Data:** 2026-05-09
**Autor:** Pedro Almeida
**Escopo:** Backend `gwan-imoveis-backend`

---

## 1. Objetivo

Adicionar busca semântica de imóveis baseada em embeddings (RAG) no backend, permitindo
consultas em linguagem natural ("apartamento perto do mar com piscina e área gourmet")
que retornem imóveis ordenados por similaridade vetorial, opcionalmente combinada com
os filtros estruturados atuais (cidade, tipo, faixa de preço, finalidade).

Objetivos secundários:

- Embeddings sempre sincronizados com o estado do imóvel (regerados em create/update).
- Persistir o **chunk de texto** que foi vetorizado, junto ao embedding, para
  rastreabilidade, debug e re-indexação sem chamar a API novamente.
- **Provider de embedding configurável** (Voyage/Anthropic vs OpenAI), seguindo o
  mesmo padrão de `AI_PROVIDER` já usado no chat (`ChatModelRouterService`).
- **Default: Voyage AI** (recomendação oficial da Anthropic para embeddings).
- Possibilidade de trocar para OpenAI sem alterar código, apenas via env var.

---

## 2. Decisão: novo endpoint vs. estender `GET /api/properties`

**Decisão recomendada: criar novo endpoint `GET /api/properties/search`.**

Justificativa:

| Critério | Estender `GET /properties` com `?q=` | Novo `GET /properties/search` |
|---|---|---|
| Forma da resposta | Mistura: às vezes ordenado por `createdAt`, às vezes por `score` | Sempre `[{ property, score, distance }]` |
| Comportamento sem `q` | Endpoint vira ambíguo | Endpoint dedicado, contrato claro |
| Cache HTTP / MCP tool | Mesma tool faz duas coisas diferentes | Tool separada `search_properties_semantic` |
| Custo | Risco de sempre chamar OpenAI por engano | Chamada à OpenAI só em rota explícita |
| Compatibilidade | Quebra clientes que dependem da ordem atual | Zero breaking change |

O endpoint atual `GET /api/properties` continua **inalterado** (filtros estruturados,
público, sem custo de embedding). O novo endpoint aceita os mesmos filtros estruturados
como **pré-filtro** antes de aplicar similaridade vetorial — útil para "casas de praia
em São Sebastião até R$ 1M parecidas com X".

---

## 3. Arquitetura proposta

### 3.1. Banco de dados

**Extensão:** `pgvector` (já em uso na infra GWAN — ver `CLAUDE.md` raiz).

**Estratégia de dimensão (multi-provider):** **preservar dimensão nativa** de cada
provider. Como Voyage e OpenAI usam dimensões diferentes e vetores de providers
diferentes não são comparáveis matematicamente, optamos por **uma coluna por provider**:

- **Voyage** (`voyage-3-lite`, default): dimensão nativa **512**.
- **OpenAI** (`text-embedding-3-small`): dimensão nativa **1536**.

Vantagens dessa abordagem:

1. **Troca de provider é instantânea** — basta mudar `EMBEDDING_PROVIDER` no Portainer.
   Vetores antigos do outro provider continuam intactos no banco; podem ser usados
   de novo se voltar atrás, sem regerar nada.
2. **Período de transição limpo** — durante um backfill de migração entre providers,
   a coluna do provider antigo continua servindo a search; quando a coluna do provider
   novo enche, a search passa a usar ela.
3. **Cada provider tem seu próprio índice HNSW otimizado** para a dimensão nativa.
4. **Sem perda de qualidade** — não estamos truncando vetores via Matryoshka.

**Novas colunas em `properties`:**

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `embeddingVoyage` | `vector(512)` | sim | Vetor Voyage (`voyage-3-lite` = 512 dim) |
| `embeddingVoyageModel` | `varchar(64)` | sim | Modelo Voyage usado (ex.: `voyage-3-lite`) |
| `embeddingVoyageUpdatedAt` | `timestamptz` | sim | Quando foi gerado |
| `embeddingOpenai` | `vector(1536)` | sim | Vetor OpenAI (`text-embedding-3-small` = 1536 dim) |
| `embeddingOpenaiModel` | `varchar(64)` | sim | Modelo OpenAI usado (ex.: `text-embedding-3-small`) |
| `embeddingOpenaiUpdatedAt` | `timestamptz` | sim | Quando foi gerado |
| `embeddingChunk` | `text` | sim | Texto que originou os embeddings (compartilhado — chunk é determinístico) |

Todas nullable para permitir backfill incremental sem quebrar imóveis existentes.

> O chunk é **compartilhado** porque é determinístico: dado o mesmo `Property`, o
> texto gerado por `buildPropertyEmbeddingChunk` é idêntico independentemente do
> provider. Os dois embeddings descrevem o mesmo conteúdo, só diferem no espaço
> vetorial.

**Índices HNSW (um por coluna):**

```sql
CREATE INDEX idx_properties_embedding_voyage_hnsw
  ON properties USING hnsw ("embeddingVoyage" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_properties_embedding_openai_hnsw
  ON properties USING hnsw ("embeddingOpenai" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

> Se em produção apenas um provider for usado de fato, o índice da coluna vazia
> ocupa espaço desprezível (HNSW só indexa linhas com valor não-nulo se usarmos
> índice parcial — opcional). Sem otimização prematura: criar os dois.

**Índice vetorial:** HNSW com operador `vector_cosine_ops`:

```sql
CREATE INDEX idx_properties_embedding_hnsw
  ON properties
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

HNSW > IVFFlat para nosso volume (dezenas a centenas de imóveis): melhor recall sem
treinar quando a tabela está vazia/pequena.

### 3.2. Geração do chunk

Função pura `buildPropertyEmbeddingChunk(property)` que monta um texto canônico em PT-BR
com os campos relevantes para busca semântica. Exemplo de chunk gerado:

```
Tipo: Casa | Finalidade: Aluguel | Local: Maresias, São Sebastião
Quartos: 3 | Banheiros: 2 | Vagas: 2 | Área: 150m²
Preço: R$ 850.000,00
Comodidades: piscina, frente para o mar, jardim, área gourmet
Título: Casa de Praia Luxuosa com Vista para o Mar
Descrição: Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina...
```

Regras:

- Campos booleanos viram lista de termos legíveis ("piscina", "frente para o mar"...).
- Enums (`type`, `purpose`) são traduzidos para PT-BR (Casa, Apartamento, Aluguel, Venda...).
- `title` e `description` ficam por último (peso natural via repetição contextual).
- Função 100% determinística — dado mesmo property, mesmo chunk → cache friendly.

### 3.3. Multi-provider de embedding (Voyage / OpenAI)

Réplica do padrão usado no chat ([`chat-model-router.service.ts:1`](../../src/chat/services/providers/chat-model-router.service.ts)):
um router lê uma env var e delega para a implementação correspondente.

#### Por que Voyage e não "Claude"?

Anthropic **não publica modelos de embedding próprios**. A documentação oficial
([docs.anthropic.com/en/docs/build-with-claude/embeddings](https://docs.anthropic.com/en/docs/build-with-claude/embeddings))
recomenda **Voyage AI** como provider de embeddings para ecossistema Claude. Voyage
foi adquirida pela MongoDB em 2025 mas a API segue compatível.

Tratamos `EMBEDDING_PROVIDER=voyage` como o "embedding da Claude" — é a recomendação
canônica da Anthropic. Se no futuro a Anthropic lançar embedding nativo, basta
adicionar um terceiro provider sem alterar a interface.

#### Estrutura de classes

```
src/shared/infrastructure/services/embedding/
├── embedding-router.service.ts          # Router (lê EMBEDDING_PROVIDER, delega)
├── voyage-embedding-provider.service.ts # Implementação Voyage (default)
├── openai-embedding-provider.service.ts # Implementação OpenAI (renomear arquivo atual)
└── embedding-provider.interface.ts      # Contrato comum
```

A `EmbeddingService` atual ([`src/shared/infrastructure/services/embedding.service.ts`](../../src/shared/infrastructure/services/embedding.service.ts))
vira `OpenAiEmbeddingProviderService` (renomear + ajustar). A interface
`IEmbeddingService` continua existindo e passa a ser implementada pelo
**router**, não pelos providers — assim o resto do código que injeta
`@Inject('IEmbeddingService')` não muda.

#### Contrato do provider

```typescript
// embedding-provider.interface.ts
export type EmbeddingProviderName = 'voyage' | 'openai';

export interface EmbeddingResult {
  vector: number[];
  provider: EmbeddingProviderName;
  model: string;
  dimension: number;
}

export interface IEmbeddingProvider {
  generate(text: string, opts?: { inputType?: 'document' | 'query' }): Promise<EmbeddingResult>;
  getProviderName(): EmbeddingProviderName;
  getModel(): string;
  getDimension(): number;
}
```

`inputType` existe porque Voyage diferencia explicitamente embedding de **documento**
(o imóvel sendo indexado) vs **query** (texto de busca) — mesma semântica, vetores
levemente diferentes para melhor recall. OpenAI ignora esse parâmetro silenciosamente.

#### Configuração via env vars

| Variável | Default | Descrição |
|---|---|---|
| `EMBEDDING_PROVIDER` | `voyage` | `voyage` ou `openai` |
| **Voyage** |  |  |
| `VOYAGE_API_KEY` | — | Obrigatória se `EMBEDDING_PROVIDER=voyage` |
| `VOYAGE_EMBEDDING_MODEL` | `voyage-3-lite` | Modelo Voyage (dim nativa 512) |
| `VOYAGE_API_BASE_URL` | `https://api.voyageai.com/v1` | Para uso futuro com proxy/self-hosted |
| **OpenAI** |  |  |
| `OPENAI_API_KEY` | — | Obrigatória se `EMBEDDING_PROVIDER=openai` (já existe, usada no chat) |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Modelo OpenAI (dim nativa 1536) |

> Não há `EMBEDDING_DIMENSION` — cada provider conhece sua própria dimensão nativa
> e a expõe via `getDimension()`. O router valida na boot que a dimensão retornada
> bate com o `vector(N)` da coluna correspondente.

> Vou **adicionar essas variáveis** em três lugares:
> - `gwan-imoveis-backend/.env.example` — referência local
> - `apps/imoveis/.env.example` (se existir, criar) — referência do compose
> - `apps/imoveis/docker-compose.yml` — passar para o container do backend
> - `gwan-infra/.env.example` (raiz) — variáveis globais que o Portainer usa

#### Roteamento

```typescript
// embedding-router.service.ts (esqueleto)
@Injectable()
export class EmbeddingRouterService implements IEmbeddingService {
  private readonly active: IEmbeddingProvider;

  constructor(
    config: ConfigService,
    voyage: VoyageEmbeddingProviderService,
    openai: OpenAiEmbeddingProviderService,
  ) {
    const name = (config.get<string>('EMBEDDING_PROVIDER') || 'voyage').toLowerCase();
    this.active = name === 'openai' ? openai : voyage;
    this.logger.log(`Embedding provider ativo: ${this.active.getProviderName()} / ${this.active.getModel()}`);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.active.generate(text, { inputType: 'document' });
    return result.vector;
  }

  // novo método para o write path saber qual provider usou
  async generateEmbeddingDetailed(text: string, inputType: 'document' | 'query'): Promise<EmbeddingResult> {
    return this.active.generate(text, { inputType });
  }

  getEmbeddingDimension(): number { return this.active.getDimension(); }
  getModel(): string { return this.active.getModel(); }
  getProviderName(): EmbeddingProviderName { return this.active.getProviderName(); }
}
```

#### Detalhes de implementação por provider

**Voyage** (`POST https://api.voyageai.com/v1/embeddings`):

```json
{
  "input": ["texto do imóvel..."],
  "model": "voyage-3-lite",
  "input_type": "document"
}
```

Headers: `Authorization: Bearer $VOYAGE_API_KEY`. Resposta:
`{ "data": [{ "embedding": [...], "index": 0 }], "model": "...", "usage": {...} }`.
`voyage-3-lite` retorna sempre 512 dim — sem parâmetro `output_dimension`.

**OpenAI** (`POST https://api.openai.com/v1/embeddings`):

```json
{
  "input": "texto do imóvel...",
  "model": "text-embedding-3-small"
}
```

Headers: `Authorization: Bearer $OPENAI_API_KEY`. Resposta segue o mesmo formato
geral. `text-embedding-3-small` retorna sempre 1536 dim nativos — sem parâmetro
`dimensions`. O serviço atual já trata isso, basicamente sem mudanças funcionais.

#### Validação de boot

No `onModuleInit` do router:

1. Loga `EMBEDDING_PROVIDER` ativo + modelo + dimensão.
2. Valida que a chave de API do provider ativo existe; se não, loga **error** mas
   não derruba a app (degrada graciosamente — search retorna 503, write segue).
3. Mapeia provider → coluna alvo (`voyage` → `embeddingVoyage`, `openai` → `embeddingOpenai`)
   e expõe esse mapping para o repositório usar.

### 3.4. Sincronização do embedding (write path)

Estratégia **inline + tolerante a falha**:

1. `CreatePropertyUseCase` / `UpdatePropertyUseCase` salvam o imóvel normalmente.
2. Após o save, chamam `GeneratePropertyEmbeddingUseCase`:
   - Monta chunk → chama `EmbeddingRouterService.generateEmbeddingDetailed(chunk, 'document')`
     → atualiza `embeddingChunk` e a tripla específica do provider ativo:
     - Se Voyage: `embeddingVoyage`, `embeddingVoyageModel`, `embeddingVoyageUpdatedAt`.
     - Se OpenAI: `embeddingOpenai`, `embeddingOpenaiModel`, `embeddingOpenaiUpdatedAt`.
   - A coluna do **outro** provider fica intacta (pode estar vazia ou ter um vetor
     antigo de uma sessão anterior — qualquer cenário é válido).
3. Se o embedding falhar (provider fora, timeout, sem API key), o use case **loga warning**
   e segue. O imóvel fica criado/atualizado, sem embedding novo (a coluna do provider
   ativo permanece como estava — vazia ou desatualizada).

Otimização do `update`: só regerar embedding se algum campo "semântico" mudou (title,
description, type, purpose, neighborhood, city, bedrooms, bathrooms, area, garageSpaces,
booleanos de amenidades, price). Mudanças puras em `coverImageUrl` ou metadados não
disparam regeração.

> Decisão futura (fora deste plano): se a quantidade de updates crescer, mover para fila
> assíncrona (BullMQ + Redis já presentes na infra). Por ora, inline é suficiente.

### 3.5. Read path: `GET /api/properties/search`

**Contrato:**

```
GET /api/properties/search?q=<texto>
  &city=<string>
  &type=<CASA|APARTAMENTO|TERRENO|SALA_COMERCIAL>
  &purpose=<RENT|SALE|INVESTMENT>
  &minPrice=<number>
  &maxPrice=<number>
  &realtorId=<uuid>
  &limit=<int, default 20, max 50>
  &minScore=<float 0..1, default 0.0>
```

**Comportamento:**

1. `q` é obrigatório. Sem `q` → 400 (use o endpoint regular).
2. Backend gera embedding de `q` via `EmbeddingRouterService.generateEmbeddingDetailed(q, 'query')`.
3. Repositório resolve a **coluna alvo** com base no provider ativo
   (`embeddingVoyage` ou `embeddingOpenai`) e executa query com pré-filtros estruturados
   + ordenação por `<coluna_alvo> <=> :query_embedding` (cosine distance), com
   `WHERE <coluna_alvo> IS NOT NULL`.
4. Resposta:

```json
[
  {
    "property": { /* PropertyResponseDto atual */ },
    "score": 0.87,
    "distance": 0.13
  }
]
```

`score = 1 - distance` (cosine), facilita threshold no cliente.

**Público (sem auth)** — segue o padrão do `GET /properties` atual.

**MCP tool:** anotar com `@ApiExtension('x-mcp', { toolName: 'search_properties_semantic' })`
para que o agente IA do chat use diretamente.

---

## 4. Arquivos afetados / criados

### Criar

- `src/migrations/<timestamp>-AddPropertyEmbedding.ts`
  - `CREATE EXTENSION IF NOT EXISTS vector`
  - `ALTER TABLE properties ADD COLUMN "embeddingVoyage" vector(512)`
  - `ALTER TABLE properties ADD COLUMN "embeddingVoyageModel" varchar(64)`
  - `ALTER TABLE properties ADD COLUMN "embeddingVoyageUpdatedAt" timestamptz`
  - `ALTER TABLE properties ADD COLUMN "embeddingOpenai" vector(1536)`
  - `ALTER TABLE properties ADD COLUMN "embeddingOpenaiModel" varchar(64)`
  - `ALTER TABLE properties ADD COLUMN "embeddingOpenaiUpdatedAt" timestamptz`
  - `ALTER TABLE properties ADD COLUMN "embeddingChunk" text`
  - `CREATE INDEX idx_properties_embedding_voyage_hnsw ON properties USING hnsw ("embeddingVoyage" vector_cosine_ops)`
  - `CREATE INDEX idx_properties_embedding_openai_hnsw ON properties USING hnsw ("embeddingOpenai" vector_cosine_ops)`
- `src/shared/infrastructure/services/embedding/embedding-provider.interface.ts`
  - Contrato `IEmbeddingProvider` + tipos `EmbeddingResult`, `EmbeddingProviderName`.
- `src/shared/infrastructure/services/embedding/voyage-embedding-provider.service.ts`
  - Provider Voyage (default).
- `src/shared/infrastructure/services/embedding/openai-embedding-provider.service.ts`
  - Renomeado/movido a partir do `embedding.service.ts` atual; adiciona param `dimensions`.
- `src/shared/infrastructure/services/embedding/embedding-router.service.ts`
  - Lê `EMBEDDING_PROVIDER`, delega; implementa `IEmbeddingService` (compatível com
    código atual) + método novo `generateEmbeddingDetailed`.
- `src/shared/application/interfaces/embedding-service.interface.ts`
  - **Atualizar** com método `generateEmbeddingDetailed` e `getProviderName()`.
- `src/shared/application/use-cases/generate-property-embedding.use-case.ts`
- `src/shared/application/use-cases/search-properties-semantic.use-case.ts`
- `src/shared/application/services/property-embedding-chunk.builder.ts`
  - Função pura `buildPropertyEmbeddingChunk(property)`.
- `src/properties/presentation/dtos/search-properties.dto.ts`
- `src/properties/presentation/dtos/property-search-result.dto.ts`
- `src/scripts/backfill-property-embeddings.ts`
  - Script standalone para popular embeddings dos imóveis existentes (idempotente).
  - Aceita flag `--force` para regerar todos (ex.: após troca de provider).
  - Aceita flag `--provider=voyage|openai` para override pontual.
- `src/properties/features/search-properties-semantic.feature` (BDD)
- `src/properties/steps/search-properties-semantic.steps.ts`

### Alterar

- `src/shared/domain/entities/property.entity.ts`
  - Adicionar 7 campos: `embeddingVoyage`, `embeddingVoyageModel`, `embeddingVoyageUpdatedAt`,
    `embeddingOpenai`, `embeddingOpenaiModel`, `embeddingOpenaiUpdatedAt`, `embeddingChunk`.
  - Marcar `embeddingVoyage` e `embeddingOpenai` com `select: false` (vetores não voltam
    em queries normais; só a search do RAG os lê).
- `src/shared/domain/interfaces/property-repository.interface.ts`
  - Novo método `searchBySimilarity(embedding: number[], filters, limit, minScore)`.
- `src/shared/infrastructure/repositories/property-typeorm.repository.ts`
  - Implementar `searchBySimilarity(provider, embedding, filters, limit, minScore)` que
    seleciona a coluna alvo (`embeddingVoyage` ou `embeddingOpenai`) com base em `provider`
    e usa o operador `<=>` no `createQueryBuilder`.
  - Novo método `updateEmbedding(id, result: EmbeddingResult, chunk: string)` que faz
    update direto sem trazer entidade (evita serialização do vetor) e grava nas 3
    colunas específicas do provider de `result.provider`.
- `src/shared/application/use-cases/create-property.use-case.ts`
  - Após `propertyRepository.save`, disparar `GeneratePropertyEmbeddingUseCase`
    em try/catch (não falhar a criação).
- `src/shared/application/use-cases/update-property.use-case.ts`
  - Mesma lógica, mas só dispara se algum campo semântico mudou.
- `src/properties/properties.controller.ts`
  - Novo `@Get('search')` (antes de `@Get(':id')` para não conflitar com rota dinâmica).
- `src/properties/properties.module.ts`
  - Registrar novos use cases.
- `src/shared/shared.module.ts`
  - Trocar provider de `IEmbeddingService`: era `EmbeddingService`, passa a ser
    `EmbeddingRouterService`.
  - Registrar `VoyageEmbeddingProviderService` e `OpenAiEmbeddingProviderService`.
  - Exportar `GeneratePropertyEmbeddingUseCase` se for usado em outros módulos.
- `gwan-imoveis-backend/.env.example`
  - Adicionar `EMBEDDING_PROVIDER=voyage` (default), `VOYAGE_API_KEY=`,
    `VOYAGE_EMBEDDING_MODEL=voyage-3-lite`.
  - `OPENAI_EMBEDDING_MODEL` já existe — manter como fallback.
- `apps/imoveis/docker-compose.yml` (gwan-infra)
  - Adicionar as novas env vars na seção `environment:` do serviço backend.
- `gwan-infra/.env.example` (raiz)
  - Adicionar variáveis globais que o Portainer injeta no compose.

### Não alterar

- `GET /api/properties` (lista atual) — permanece com mesmo contrato.
- `GET /api/properties/:id` — permanece sem retornar `embedding` (campo `select: false`).

---

## 5. Migração e rollout

1. **Migration up:**
   - `CREATE EXTENSION IF NOT EXISTS vector` (idempotente).
   - Add columns (todas nullable).
   - Cria índice HNSW.
2. **Migration down:**
   - DROP INDEX, DROP COLUMNs (não dropa extensão — pode ser usada por outras apps).
3. **Backfill:**
   - Rodar `npm run script:backfill-embeddings` em produção uma vez.
   - Itera imóveis com `embedding IS NULL`, gera chunk, chama OpenAI, salva.
   - Rate limit: 1 req/200ms (~5 RPS) — OpenAI tier free aguenta. Configurável.
   - Idempotente: pode ser interrompido e retomado.
4. **Deploy via Portainer** seguindo padrão GWAN (CLAUDE.md): nada de SSH.

---

## 6. Considerações de custo e operação

**Custo por provider** (preços de referência abril 2026):

| Provider | Modelo | Dim | Preço | 1k imóveis (~300 tok cada) |
|---|---|---|---|---|
| **Voyage** (default) | `voyage-3-lite` | 512 | US$ 0,02 / 1M tok | ~US$ 0,006 |
| Voyage | `voyage-3-large` | 1024 | US$ 0,18 / 1M tok | ~US$ 0,054 |
| OpenAI | `text-embedding-3-small` | 1536 | US$ 0,02 / 1M tok | ~US$ 0,006 |
| OpenAI | `text-embedding-3-large` | 3072 | US$ 0,13 / 1M tok | ~US$ 0,04 |

Para o volume atual (< 100 imóveis), custo é desprezível em qualquer provider.
Cada busca semântica gera 1 embedding (~5 tokens da query). Custo ainda menor.

**Latência:**
- Voyage: ~150–400ms por embedding
- OpenAI: ~200–500ms por embedding
- HNSW search: 5–20ms

**Comportamento sem API key configurada:**
- `EMBEDDING_PROVIDER=voyage` mas sem `VOYAGE_API_KEY` →
  Endpoint `/properties/search` retorna 503 com mensagem clara.
  Create/Update continuam funcionando (warn no log).
- Mesmo padrão para OpenAI.

**Qualidade comparativa:**
- `voyage-3-lite` (default) é a versão econômica/rápida do Voyage, ainda competitiva
  em multilíngue (PT-BR). 512 dim → índice HNSW menor e busca mais rápida.
- `voyage-3-large` lidera benchmarks MTEB mas é ~9x mais caro — overkill para nosso volume.
- OpenAI `text-embedding-3-small` é referência sólida; 1536 dim ocupa ~3x mais espaço.
- Diferença de qualidade em busca de imóveis no nosso domínio (descrições curtas,
  vocabulário restrito) é marginal — `voyage-3-lite` é a escolha pragmática.

---

## 7. Testes

### Unitários (Jest)

- `property-embedding-chunk.builder.spec.ts` — chunk determinístico, cobre todos os
  enums, booleanos, campos opcionais.
- `generate-property-embedding.use-case.spec.ts` — mock do `EmbeddingRouterService`.
- `search-properties-semantic.use-case.spec.ts` — mock do repositório.
- `embedding-router.service.spec.ts` — verifica delegação correta com base em
  `EMBEDDING_PROVIDER`, fallback de default, validação de dimensão.
- `voyage-embedding-provider.service.spec.ts` — mock HTTP via nock/jest, valida
  payload (input_type, output_dimension), parsing da resposta, tratamento de erro.
- `openai-embedding-provider.service.spec.ts` — idem para OpenAI.

### BDD (Cucumber)

- `search-properties-semantic.feature`:
  - Busca retorna resultados ordenados por score
  - Pré-filtros estruturados aplicados antes da similaridade
  - Imóveis sem embedding na coluna do provider ativo são excluídos do resultado
  - Sem `q` → 400
  - Sem API key do provider ativo → 503
- `embedding-provider-switch.feature`:
  - Cenário: criar imóvel com Voyage ativo → coluna `embeddingVoyage` populada,
    `embeddingOpenai` permanece NULL
  - Cenário: trocar `EMBEDDING_PROVIDER` para openai → search retorna vazio até
    backfill rodar; coluna `embeddingVoyage` continua intacta
  - Cenário: rodar backfill com OpenAI ativo → coluna `embeddingOpenai` enche;
    voltar para Voyage → search volta a funcionar instantaneamente sem backfill
    (vetores Voyage antigos ainda servem)

### Integração

- Subir Postgres com pgvector via docker-compose local
- Seed cria 8 imóveis → backfill gera embeddings → consulta semântica

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Extensão `vector` não instalada no Postgres GWAN | Migration usa `CREATE EXTENSION IF NOT EXISTS`; validar com `SELECT * FROM pg_extension WHERE extname='vector'` no Portainer antes do deploy |
| Embedding falha em produção e bloqueia create | Geração inline em try/catch; create sempre completa |
| Custo OpenAI surpresa | Volume baixo + log estruturado de cada chamada; possível rate limit |
| Drift entre `embedding` e estado do imóvel | `embeddingUpdatedAt` permite detectar staleness; comparação com `updatedAt` no health endpoint |
| Mudança de modelo dentro do mesmo provider | Coluna `embedding<Provider>Model` permite detectar drift; backfill com `--force` regera |
| **Troca de provider em produção** (Voyage ↔ OpenAI) | Colunas separadas: troca é instantânea. Após mudar `EMBEDDING_PROVIDER`, search passa a usar a coluna do novo provider — pode estar vazia se nunca rodou backfill com ele. Fluxo: (1) trocar env var no Portainer, (2) rodar `backfill --provider=<novo>` para popular a coluna, (3) search começa a retornar resultados conforme backfill progride. Voltar atrás é grátis: vetores antigos do provider anterior continuam intactos |
| API key do provider ativo vazia / rate limit | Warn no log, endpoint de search retorna 503, create/update seguem; coluna do provider ativo simplesmente não é populada |
| Dimensão retornada pela API ≠ dimensão da coluna (`vector(N)`) | Validação no boot do router contra constante por provider (Voyage 512, OpenAI 1536); rejeita embeddings com dimensão inesperada antes de persistir |
| Modelo do provider mudar de dimensão (ex.: trocar `voyage-3-lite` para `voyage-3-large` que tem 1024) | Bloqueado por validação acima. Para trocar de modelo dentro do mesmo provider mudando dimensão, precisa de migration que altere a coluna — fluxo idêntico a "troca de provider" mas dentro do mesmo namespace |
| Quebra do endpoint atual | Nenhuma — novo endpoint, contrato adicional, sem alterar `GET /properties` |

---

## 9. Fora de escopo (próximas iterações)

- Reranking com modelo cross-encoder
- Filtros por raio geográfico (lat/long ainda não existem na entidade)
- Busca híbrida (BM25 + vetorial) com `pg_trgm`
- Embedding de imagens (CLIP) para busca por foto similar
- Atualização em fila assíncrona (BullMQ)
- Cache de embedding de queries frequentes (Redis)

---

## 10. Checklist de execução (após validação)

**Fase 1 — Multi-provider de embedding (refactor sem RAG ainda)**
- [ ] Criar `IEmbeddingProvider` + `EmbeddingResult` em `services/embedding/embedding-provider.interface.ts`
- [ ] Refatorar `embedding.service.ts` atual em `OpenAiEmbeddingProviderService` (mover, renomear, adicionar param `dimensions`)
- [ ] Criar `VoyageEmbeddingProviderService`
- [ ] Criar `EmbeddingRouterService` (lê `EMBEDDING_PROVIDER`, delega)
- [ ] Atualizar `IEmbeddingService` com `generateEmbeddingDetailed` + `getProviderName`
- [ ] Trocar provider em `shared.module.ts` para `EmbeddingRouterService`
- [ ] Adicionar env vars em `.env.example` (backend, app/imoveis, infra/raiz)
- [ ] Adicionar env vars no `apps/imoveis/docker-compose.yml`
- [ ] Testes unitários do router e dos dois providers

**Fase 2 — Migration e entidade**
- [ ] Criar migration `AddPropertyEmbedding`:
  - 7 colunas novas (3 Voyage + 3 OpenAI + 1 chunk compartilhado)
  - 2 índices HNSW (um por coluna de vetor)
- [ ] Validar pgvector instalado no Postgres GWAN (Portainer)
- [ ] Atualizar `Property` entity (7 colunas novas, `select: false` nos 2 vetores)
- [ ] Adicionar métodos de embedding ao `IPropertyRepository`

**Fase 3 — Write path**
- [ ] Implementar `buildPropertyEmbeddingChunk` + testes unitários
- [ ] Implementar `GeneratePropertyEmbeddingUseCase`
- [ ] Implementar `propertyRepository.updateEmbedding(id, result)`
- [ ] Plugar geração no `CreatePropertyUseCase` (try/catch tolerante)
- [ ] Plugar geração no `UpdatePropertyUseCase` (só se campo semântico mudou)

**Fase 4 — Read path**
- [ ] Adicionar `searchBySimilarity(provider, embedding, filters, limit, minScore)` no repository (seleciona coluna alvo)
- [ ] Implementar `SearchPropertiesSemanticUseCase`
- [ ] DTOs `SearchPropertiesDto`, `PropertySearchResultDto`
- [ ] Adicionar rota `GET /properties/search` no controller (ANTES de `@Get(':id')`)
- [ ] Anotar MCP tool extension `search_properties_semantic`
- [ ] BDD `search-properties-semantic.feature` + steps
- [ ] BDD `embedding-provider-switch.feature` + steps

**Fase 5 — Backfill e ops**
- [ ] Script `backfill-property-embeddings.ts` (com flags `--force` e `--provider`)
- [ ] Atualizar `properties.http` com exemplos da nova rota
- [ ] Atualizar `apps/imoveis/CLAUDE.md` com a nova feature e env vars
- [ ] Documentar em `docs/features/` o fluxo de troca de provider

**Fase 6 — Deploy**
- [ ] Validar localmente com Postgres + pgvector via `docker compose`
- [ ] Deploy via Portainer
- [ ] Rodar backfill inicial em produção
- [ ] Validar busca semântica com queries reais
