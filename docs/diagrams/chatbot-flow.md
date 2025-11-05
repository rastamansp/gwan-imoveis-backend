# 🔄 Fluxo Completo do Chatbot - Diagrama Mermaid

## Fluxo Principal de Processamento

```mermaid
flowchart TD
    Start([Usuário envia mensagem]) --> Validate{Validar mensagem}
    Validate -->|Válida| BuildPrompt[Construir prompt do sistema]
    Validate -->|Inválida| Error1[Retornar erro]
    
    BuildPrompt --> LoadTools[Carregar schema de tools]
    LoadTools --> SendOpenAI[Enviar para OpenAI GPT]
    
    SendOpenAI --> Analyze{OpenAI analisa mensagem}
    Analyze -->|Precisa tool| CallTool[Chamar tool via MCP]
    Analyze -->|Não precisa tool| DirectAnswer[Gerar resposta direta]
    
    CallTool --> MapTool{Qual tool usar?}
    
    MapTool -->|Eventos| EventTools{Qual busca de evento?}
    MapTool -->|Artistas| ArtistTools{Qual busca de artista?}
    
    EventTools -->|Nome específico| EventQuery[search_events_by_query]
    EventTools -->|Descrição genérica| EventRAG[search_events_rag]
    EventTools -->|Listar todos| EventList[events.search]
    EventTools -->|Detalhes| EventDetail[get_event_by_id]
    EventTools -->|Ingressos| EventTickets[get_event_ticket_categories]
    
    ArtistTools -->|Nome específico| ArtistQuery[search_artists_by_query]
    ArtistTools -->|Descrição genérica| ArtistRAG[search_artists_rag]
    ArtistTools -->|Listar todos| ArtistList[list_artists]
    ArtistTools -->|Detalhes| ArtistDetail[get_artist_by_id]
    
    EventQuery --> MCP[MCP Bridge]
    EventRAG --> MCP
    EventList --> MCP
    EventDetail --> MCP
    EventTickets --> MCP
    
    ArtistQuery --> MCP
    ArtistRAG --> MCP
    ArtistList --> MCP
    ArtistDetail --> MCP
    
    MCP --> BackendAPI[APIs Backend]
    BackendAPI --> Database[(Database)]
    Database --> BackendAPI
    BackendAPI --> MCP
    MCP --> ProcessResults[Processar resultados]
    
    ProcessResults --> Format{Qual canal?}
    Format -->|Web| FormatWeb[WebFormatterService]
    Format -->|WhatsApp| FormatWhatsApp[WhatsAppFormatterService]
    
    FormatWeb --> ResponseWeb[Resposta Web formatada]
    FormatWhatsApp --> ResponseWhatsApp[Resposta WhatsApp formatada]
    
    DirectAnswer --> Format
    
    ResponseWeb --> End([Retornar resposta])
    ResponseWhatsApp --> End
    Error1 --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style MCP fill:#fff4e1
    style BackendAPI fill:#fff4e1
    style Database fill:#ffe1f5
    style FormatWeb fill:#e1ffe1
    style FormatWhatsApp fill:#e1ffe1
```

## Fluxo de Busca de Eventos (Decisão)

```mermaid
flowchart TD
    Start([Usuário pergunta sobre eventos]) --> CheckQuery{Analisar query}
    
    CheckQuery -->|Contém código EVT-| QueryByCode[search_events_by_query]
    CheckQuery -->|Nome específico 1-4 palavras| QueryByName[search_events_by_query]
    CheckQuery -->|Descrição genérica| QueryRAG[search_events_rag]
    CheckQuery -->|Múltiplos critérios| QueryRAG
    CheckQuery -->|Frase conversacional| QueryRAG
    CheckQuery -->|Preposições de/para/com| QueryRAG
    
    QueryByCode --> Execute1[Executar busca]
    QueryByName --> Execute1
    QueryRAG --> Execute2[Executar busca semântica]
    
    Execute1 --> HasResults{Encontrou resultados?}
    HasResults -->|Sim| FormatResults[Formatar resultados]
    HasResults -->|Não| Fallback[Fallback: tentar search_events_rag]
    
    Fallback --> Execute2
    Execute2 --> FormatResults
    
    FormatResults --> Response([Retornar resposta formatada])
    
    style Start fill:#e1f5ff
    style Response fill:#e1f5ff
    style QueryByCode fill:#ffe1f5
    QueryByName fill:#ffe1f5
    style QueryRAG fill:#e1ffe1
    style Fallback fill:#fff4e1
```

## Fluxo WhatsApp: Detalhes de Evento

```mermaid
sequenceDiagram
    participant U as Usuário WhatsApp
    participant WA as WhatsApp Webhook
    participant CS as ChatService
    participant OAI as OpenAI GPT
    participant MCP as MCP Bridge
    participant API as Event API
    participant FMT as WhatsApp Formatter
    participant EVO as Evolution API
    
    U->>WA: "Tenho interesse no evento ID"
    WA->>CS: chat(message, userCtx, "whatsapp")
    
    CS->>OAI: Prompt + Tools Schema
    OAI->>CS: tool_calls: [get_event_by_id]
    
    CS->>MCP: callTool("get_event_by_id", {id})
    MCP->>API: GET /api/events/{id}
    API->>API: Buscar evento + categorias
    API->>MCP: Event + TicketCategories
    MCP->>CS: Dados completos
    
    CS->>OAI: Enviar resultados
    OAI->>CS: Resposta formatada
    
    CS->>FMT: formatResponse("event_detail")
    FMT->>FMT: formatEventDetailWithDetails()
    FMT->>FMT: formatTicketsMessage()
    FMT->>CS: FormattedResponse
    
    CS->>WA: {answer, media, data.ticketsMessage}
    
    WA->>EVO: sendImageMessage(imageUrl, "")
    EVO->>U: 📷 Imagem do evento
    
    WA->>WA: Delay 500ms
    
    WA->>EVO: sendTextMessage(detalhes)
    EVO->>U: 📝 Detalhes completos
    
    WA->>WA: Delay 500ms
    
    WA->>EVO: sendTextMessage(ticketsMessage)
    EVO->>U: 🎫 Ingressos + Link
```

## Fluxo de Formatação por Canal

```mermaid
flowchart TD
    Start([Resposta do OpenAI]) --> CheckChannel{Qual canal?}
    
    CheckChannel -->|web| WebFlow[Web Formatter]
    CheckChannel -->|whatsapp| WhatsAppFlow[WhatsApp Formatter]
    
    WebFlow --> WebType{Tipo de resposta?}
    WebType -->|event_list| WebEventList[Formatar lista de eventos]
    WebType -->|event_detail| WebEventDetail[Formatar detalhes]
    WebType -->|artist_list| WebArtistList[Formatar lista artistas]
    WebType -->|artist_detail| WebArtistDetail[Formatar detalhes]
    WebType -->|generic| WebGeneric[Resposta genérica]
    
    WhatsAppFlow --> WAType{Tipo de resposta?}
    WAType -->|event_list| WAEventList[Formatar lista eventos<br/>com emojis]
    WAType -->|event_detail| WAEventDetail[Formatar detalhes<br/>+ mensagem ingressos]
    WAType -->|artist_list| WAArtistList[Formatar lista artistas<br/>com emojis]
    WAType -->|artist_detail| WAArtistDetail[Formatar detalhes<br/>+ redes sociais]
    WAType -->|generic| WAGeneric[Resposta genérica<br/>com emojis]
    
    WebEventList --> WebResult[Resposta HTML/Markdown]
    WebEventDetail --> WebResult
    WebArtistList --> WebResult
    WebArtistDetail --> WebResult
    WebGeneric --> WebResult
    
    WAEventList --> WASequential[Enviar sequencialmente:<br/>Imagem + Texto]
    WAEventDetail --> WASequentialDetail[Enviar sequencialmente:<br/>Imagem + Texto + Ingressos]
    WAArtistList --> WASequential
    WAArtistDetail --> WASequential
    WAGeneric --> WAText[Enviar texto simples]
    
    WASequential --> WAResult[Resposta WhatsApp]
    WASequentialDetail --> WAResult
    WAText --> WAResult
    
    WebResult --> End([Retornar resposta])
    WAResult --> End
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style WebFlow fill:#e1ffe1
    style WhatsAppFlow fill:#ffe1f5
    style WASequentialDetail fill:#fff4e1
```

## Mapa de Tools Disponíveis

```mermaid
mindmap
  root((Chatbot Tools))
    Eventos
      events.search
        Listar todos
        Filtrar por categoria
        Filtrar por cidade
      search_events_by_query
        Busca exata
        Nome específico
        Código EVT-XXXXXX
      search_events_rag
        Busca semântica
        Descrição genérica
        Múltiplos critérios
      get_event_by_id
        Detalhes completos
        Inclui categorias
        Inclui ingressos
      get_event_ticket_categories
        Preços por categoria
        Disponibilidade
        Benefícios
    Artistas
      list_artists
        Listar todos
        Sem filtros
      search_artists_by_query
        Busca exata
        Nome artístico
        Nome completo
        Username redes sociais
      search_artists_rag
        Busca semântica
        Conceito/estilo
        Descrição genérica
      get_artist_by_id
        Detalhes completos
        Eventos vinculados
        Dados Spotify
```

## Decisão de Tool: Query vs RAG

```mermaid
flowchart TD
    Start([Mensagem do usuário]) --> Analyze{Analisar query}
    
    Analyze --> HasCode{Código EVT-?}
    HasCode -->|Sim| UseQuery[search_events_by_query]
    HasCode -->|Não| CheckLength{Tamanho query}
    
    CheckLength -->|1-3 palavras| CheckName{Parece nome próprio?}
    CheckLength -->|4+ palavras| UseRAG[search_events_rag]
    
    CheckName -->|Sim| UseQuery
    CheckName -->|Não| CheckPrepositions{Tem preposições?}
    
    CheckPrepositions -->|Sim de/para/com| UseRAG
    CheckPrepositions -->|Não| CheckDescription{É descrição genérica?}
    
    CheckDescription -->|Sim| UseRAG
    CheckDescription -->|Não| UseQuery
    
    UseQuery --> ExecuteQuery[Executar busca exata]
    UseRAG --> ExecuteRAG[Executar busca semântica]
    
    ExecuteQuery --> HasResults{Resultados?}
    HasResults -->|Sim| ReturnResults[Retornar resultados]
    HasResults -->|Não| FallbackRAG[Tentar RAG como fallback]
    
    FallbackRAG --> ExecuteRAG
    ExecuteRAG --> ReturnResults
    
    ReturnResults --> End([Resposta formatada])
    
    style Start fill:#e1f5ff
    style End fill:#e1f5ff
    style UseQuery fill:#ffe1f5
    style UseRAG fill:#e1ffe1
    style FallbackRAG fill:#fff4e1
```

