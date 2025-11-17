# Exemplos de Queries: search_events_by_query vs search_events_rag

## Situações que podem causar confusão entre as duas buscas

### 1. Queries com nomes específicos que podem ser interpretadas como conceitos

**Query:** "Culto"
- ❌ Ambíguo: Pode ser um nome exato de evento OU um tipo de evento
- ✅ Deve usar: `search_events_by_query` (busca por nome primeiro)
- **Razão:** Nome curto e específico, provável título de evento

**Query:** "Festival de Música"
- ❌ Ambíguo: Pode ser um nome de evento específico OU categoria
- ✅ Deve usar: `search_events_rag` (busca semântica)
- **Razão:** Frase descritiva, não parece título específico

### 2. Queries que misturam nome e descrição

**Query:** "Show do artista X em São Paulo"
- ❌ Ambíguo: Tem nome específico + localização
- ✅ Deve usar: `search_events_by_query` primeiro (tentar nome específico), depois `search_events_rag` se não encontrar
- **Razão:** Priorizar busca exata quando há nome específico mencionado

**Query:** "show de música em são paulo"
- ✅ Deve usar: `search_events_rag`
- **Razão:** Descrição genérica sem nome específico

### 3. Queries curtas que podem ser título OU categoria

**Query:** "Rock"
- ❌ Ambíguo: Pode ser categoria ou título
- ✅ Deve usar: `search_events_by_query` primeiro (busca por título), se não encontrar, considerar categoria
- **Razão:** Termo curto, mais provável ser título que categoria geral

**Query:** "eventos de rock"
- ✅ Deve usar: `search_events_rag`
- **Razão:** Frase descritiva com "eventos de"

### 4. Queries com palavras-chave múltiplas

**Query:** "música eletrônica são paulo"
- ✅ Deve usar: `search_events_rag`
- **Razão:** Múltiplos critérios (categoria + localização), busca conceitual

**Query:** "Culto de Ação de Graças"
- ✅ Deve usar: `search_events_by_query`
- **Razão:** Nome completo de evento, formato de título

### 5. Queries que pedem recomendações baseadas em descrição

**Query:** "quero ir em um show este fim de semana"
- ✅ Deve usar: `search_events_rag`
- **Razão:** Busca por conceito/tipo, não nome específico

**Query:** "preciso de eventos para crianças"
- ✅ Deve usar: `search_events_rag`
- **Razão:** Descrição vaga, busca por categoria/conceito

### 6. Queries com códigos

**Query:** "EVT-ABC123"
- ✅ Deve usar: `search_events_by_query`
- **Razão:** Código específico, formato conhecido

**Query:** "evento código EVT-ABC123"
- ✅ Deve usar: `search_events_by_query` (extrair código)
- **Razão:** Mesmo com texto adicional, há código específico

## Regras de Decisão

### Use `search_events_by_query` quando:
1. ✅ **Código presente**: Query contém formato EVT-XXXXXX
2. ✅ **Nome específico curto**: 1-3 palavras que parecem título (ex: "Culto", "Festival de Rock")
3. ✅ **Nome completo de evento**: Frase que parece título formal (ex: "Culto de Ação de Graças")
4. ✅ **Nome próprio mencionado**: Artista, banda, pessoa específica

### Use `search_events_rag` quando:
1. ✅ **Descrição genérica**: Query descreve tipo/categoria sem nome específico
2. ✅ **Múltiplos critérios**: Combina categoria + localização + data (ex: "música em são paulo")
3. ✅ **Frase natural/coloquial**: Linguagem conversacional (ex: "quero ver shows", "eventos legais")
4. ✅ **Conceitos abstratos**: Busca por tipo/estilo (ex: "festas para casais", "shows infantis")
5. ✅ **Preposições descritivas**: Contém "de", "para", "com", "em" (ex: "eventos de música", "shows para crianças")
6. ✅ **Busca por características**: Descrição de público-alvo, ambiente, estilo (ex: "festas ao ar livre")

### Estratégia Híbrida (quando em dúvida):
1. Tentar `search_events_by_query` primeiro se houver nome/código possível
2. Se não encontrar resultados ou relevância baixa, usar `search_events_rag`
3. Combinar resultados de ambas se necessário

## Exemplos Práticos para Teste

### Teste 1: Nome vs Conceito
- Query: "Rock" → `search_events_by_query`
- Query: "eventos de rock" → `search_events_rag`
- Query: "Festival de Rock" → `search_events_by_query` (nome possível)

### Teste 2: Descrição vs Nome
- Query: "shows de música" → `search_events_rag`
- Query: "Show de Música" → `search_events_by_query` (pode ser nome)
- Query: "show de música em são paulo" → `search_events_rag` (descrição com local)

### Teste 3: Ambiguidade
- Query: "Culto" → `search_events_by_query` (nome curto)
- Query: "cultos religiosos" → `search_events_rag` (descrição de categoria)
- Query: "Culto de Ação de Graças" → `search_events_by_query` (nome completo)

### Teste 4: Recomendação
- Query: "preciso de eventos para família" → `search_events_rag`
- Query: "quais eventos tem hoje?" → `events.search` (sem filtros) ou `search_events_rag`
- Query: "eventos grátis" → `search_events_rag` (característica)

### Teste 5: Múltiplos Critérios
- Query: "música eletrônica são paulo sábado" → `search_events_rag`
- Query: "festival de música eletrônica são paulo" → `search_events_rag` (muito específico para ser título)

