import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Usamos any para permitir propriedades específicas do OpenAI (ex.: tool_calls)
type OpenAIMessage = any;

@Injectable()
export class ChatService {
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;
  private readonly mcpBridgeBase: string;
  private readonly mcpServerToken?: string;
  private readonly maxToolIterations = 3;
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly config: ConfigService) {
    this.openaiApiKey = this.config.get<string>('OPENAI_API_KEY')!;
    this.openaiModel = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    this.mcpBridgeBase = this.config.get<string>('MCP_BRIDGE_BASE') || 'http://localhost:3001/api/mcp';
    this.mcpServerToken = this.config.get<string>('MCP_AUTH_TOKEN');
  }

  public async chat(message: string, userCtx?: Record<string, unknown>) {
    const systemPrompt = this.buildSystemPrompt();
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: this.normalizeUserMessage(message, userCtx) },
    ];

    const tools = this.buildToolsSchema();
    let iteration = 0;
    const toolsUsed: { name: string; arguments?: Record<string, unknown> }[] = [];

    // Primeira chamada ao modelo
    let completion = await this.callOpenAI(messages, tools);

    while (iteration < this.maxToolIterations && completion?.choices?.[0]?.message?.tool_calls?.length) {
      const assistantMsg = completion.choices[0].message;
      const toolCalls = assistantMsg.tool_calls || [];

      // É essencial manter a mensagem do assistente com tool_calls no histórico
      messages.push(assistantMsg);

      for (const tc of toolCalls) {
        const toolName = tc.function.name;
        const args = this.safeJsonParse(tc.function.arguments || '{}');

        // Mapear alias do agente para o nome real da tool MCP
        const mcpToolName = this.mapAgentToolToMcp(toolName);

        // Validação preventiva de UUID quando a tool exige 'id'
        if (mcpToolName === 'get_event_by_id' || mcpToolName === 'get_event_ticket_categories') {
          const candidateId = String((args as any)?.id || '');
          if (!this.isValidUuid(candidateId)) {
            const answer = 'ID de evento inválido. Forneça um UUID válido ou peça para listar eventos para escolher um ID.';
            return { answer, toolsUsed };
          }
        }
        if (mcpToolName === 'get_artist_by_id') {
          const candidateId = String((args as any)?.id || '');
          if (!this.isValidUuid(candidateId)) {
            const answer = 'ID de artista inválido. Forneça um UUID válido ou peça para listar artistas para escolher um ID.';
            return { answer, toolsUsed };
          }
        }

        const result = await this.callMcpTool(mcpToolName, args);

        toolsUsed.push({ name: toolName, arguments: args });

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: toolName,
          content: JSON.stringify(result),
        });
      }

      try {
        completion = await this.callOpenAI(messages, tools);
      } catch (err) {
        // Fallback: retornar síntese simples com base nas tools usadas
        const answer = this.buildFallbackAnswerFromTools(toolsUsed);
        return { answer, toolsUsed };
      }
      iteration++;
    }

    const answer = completion?.choices?.[0]?.message?.content || 'Sem resposta.';
    // Opcional: tentar extrair dados estruturados se o modelo devolver JSON em tool responses
    return { answer, toolsUsed };
  }

  private buildSystemPrompt(): string {
    return [
      'Você é um assistente especializado em eventos da plataforma Gwan Events.',
      'Responda às perguntas do usuário e utilize ferramentas quando precisar de dados atualizados.',
      '',
      'FERRAMENTAS DISPONÍVEIS:',
      '',
      'EVENTOS:',
      '- events.search: Lista todos os eventos (com filtros opcionais: category, city)',
      '- get_event_by_id: Obtém detalhes completos de um evento específico pelo ID',
      '- get_event_ticket_categories: Lista categorias de ingressos e preços de um evento',
      '- get_ticket_prices_by_event: Alias para get_event_ticket_categories',
      '- search_events_by_query: Busca EXATA por nome de evento ou código amigável',
      '- search_events_rag: Busca SEMÂNTICA por significado/conceito/categoria',
      '',
      'ARTISTAS:',
      '- list_artists: Lista todos os artistas cadastrados',
      '- get_artist_by_id: Obtém detalhes completos de um artista específico pelo ID (inclui eventos vinculados)',
      '- search_artists_by_query: Busca EXATA por artista usando filtros (nome artístico, nome completo, redes sociais)',
      '- search_artists_rag: Busca SEMÂNTICA de artistas por significado/conceito/estilo',
      '',
      'REGRAS PARA ESCOLHER ENTRE search_events_by_query E search_events_rag (EVENTOS):',
      '',
      'USE search_events_by_query QUANDO:',
      '1. Query contém CÓDIGO no formato EVT-XXXXXX (ex: "EVT-ABC123", "código EVT-XYZ789")',
      '2. Query é um NOME ESPECÍFICO de evento (1-4 palavras que parecem título exato):',
      '   - Exemplos: "Culto", "Festival de Rock", "Show do Artista X", "Culto de Ação de Graças"',
      '   - Palavras como "Festival", "Show", "Culto" SOZINHAS ou com complemento específico',
      '3. Query menciona NOME PRÓPRIO de artista, banda ou pessoa específica',
      '4. Query parece ser TÍTULO FORMAL de evento (inicia com maiúscula, formato nome próprio)',
      '',
      'USE search_events_rag QUANDO:',
      '1. Query é uma DESCRIÇÃO GENÉRICA sem nome específico:',
      '   - Exemplos: "eventos de música", "shows infantis", "festas para casais"',
      '2. Query combina MÚLTIPLOS CRITÉRIOS (categoria + localização + data):',
      '   - Exemplos: "música em são paulo", "shows de rock este fim de semana", "eventos culturais em rio"',
      '3. Query é FRASE NATURAL/CONVERSACIONAL:',
      '   - Exemplos: "quero ver shows", "preciso de eventos para família", "eventos legais", "quais eventos tem hoje?"',
      '4. Query busca por CONCEITO/CATEGORIA/ESTILO:',
      '   - Exemplos: "festas ao ar livre", "eventos grátis", "shows para crianças", "eventos esportivos"',
      '5. Query contém PREPOSIÇÕES DESCRITIVAS (de, para, com, em):',
      '   - Exemplos: "eventos DE música", "shows PARA família", "festivais EM são paulo"',
      '',
      'ESTRATÉGIA EM CASO DE DÚVIDA:',
      '- Se query é CURTA (1-3 palavras) e parece nome próprio → tente search_events_by_query primeiro',
      '- Se query é LONGA ou contém preposições/descrições → use search_events_rag',
      '- Se não encontrar resultados com search_events_by_query → tente search_events_rag como fallback',
      '',
      'EXEMPLOS PRÁTICOS:',
      '- "Culto" → search_events_by_query (nome curto, possível título)',
      '- "eventos de culto" → search_events_rag (descrição com preposição)',
      '- "Rock" → search_events_by_query (nome possível)',
      '- "eventos de rock" → search_events_rag (descrição genérica)',
      '- "Festival de Rock" → search_events_by_query (título formal possível)',
      '- "festival de música em são paulo" → search_events_rag (múltiplos critérios + descrição)',
      '- "EVT-ABC123" → search_events_by_query (código específico)',
      '- "shows para crianças" → search_events_rag (característica/conceito)',
      '',
      'REGRAS PARA ESCOLHER ENTRE search_artists_by_query E search_artists_rag (ARTISTAS):',
      '',
      'USE search_artists_by_query QUANDO:',
      '1. Query é NOME ARTÍSTICO ESPECÍFICO conhecido (ex: "Nome Artístico", "Artista X")',
      '2. Query menciona NOME COMPLETO específico (ex: "João Silva", "Maria Santos")',
      '3. Query menciona USERNAME de rede social específico (ex: "artistname" no Instagram)',
      '4. Query curta (1-3 palavras) que parece NOME PRÓPRIO',
      '',
      'USE search_artists_rag QUANDO:',
      '1. Query é DESCRIÇÃO GENÉRICA sem nome específico:',
      '   - Exemplos: "artista de música gospel", "cantor sertanejo", "banda de rock"',
      '2. Query combina CARACTERÍSTICAS/ESTILO:',
      '   - Exemplos: "artista cristão", "músico evangélico", "cantor de música popular"',
      '3. Query é FRASE CONVERSACIONAL:',
      '   - Exemplos: "quero encontrar artistas cristãos", "preciso de artistas para evento", "artistas que tocam rock"',
      '4. Query busca por CONCEITO/CATEGORIA/ESTILO:',
      '   - Exemplos: "artistas gospel", "bandas sertanejas", "cantores de MPB"',
      '',
      'EXEMPLOS PRÁTICOS DE ARTISTAS:',
      '- "Nome Artístico" → search_artists_by_query (nome específico)',
      '- "artista de música gospel" → search_artists_rag (descrição genérica)',
      '- "João Silva" → search_artists_by_query (nome completo)',
      '- "cantor sertanejo" → search_artists_rag (categoria/estilo)',
      '- "artistname" (username) → search_artists_by_query (username específico)',
      '- "artistas para evento cristão" → search_artists_rag (descrição conversacional)',
      '',
      'Quando retornar dados, seja objetivo e, se útil, sintetize os resultados:',
      '- Para eventos: título, data, local, preço',
      '- Para artistas: nome artístico, nome completo, biografia resumida, eventos vinculados',
    ].join('\n');
  }

  private normalizeUserMessage(message: string, userCtx?: Record<string, unknown>): string {
    const ctx = userCtx ? `\nContexto do usuário: ${JSON.stringify(userCtx)}` : '';
    return `${message}${ctx}`;
  }

  private buildToolsSchema() {
    return [
      {
        type: 'function',
        function: {
          name: 'events_search',
          description: 'Lista eventos com filtros opcionais (alias: events.search).',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Categoria do evento (ex.: Música)' },
              city: { type: 'string', description: 'Cidade (ex.: São Paulo)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_event_by_id',
          description: 'Obter detalhes de um evento pelo ID.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
            required: ['id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_event_ticket_categories',
          description: 'Listar categorias de ingresso de um evento (inclui preços por categoria).',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
            required: ['id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_ticket_prices_by_event',
          description: 'Obter preços de ingressos por evento (alias para categorias do evento).',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
            required: ['id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_events_by_query',
          description: 'Busca EXATA por nome de evento ou código. Use APENAS quando: 1) Query contém código EVT-XXXXXX, 2) Query é nome específico de evento (1-4 palavras como título), 3) Query menciona artista/banda específica. Exemplos válidos: "Culto", "EVT-ABC123", "Festival de Rock", "Show do Artista X". NÃO use para descrições genéricas.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Nome exato do evento ou código no formato EVT-XXXXXX',
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_events_rag',
          description: 'Busca SEMÂNTICA por significado/conceito. Use quando: 1) Query é descrição genérica (ex: "eventos de música"), 2) Combina múltiplos critérios (ex: "shows em são paulo"), 3) É frase conversacional (ex: "quero ver shows"), 4) Contém preposições (ex: "eventos DE rock"), 5) Busca por conceito/categoria (ex: "festas para casais"). Use esta ferramenta para buscar por significado, não por nome exato.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Query descritiva de busca semântica. Exemplos: "shows de música", "eventos infantis", "festas ao ar livre em são paulo", "eventos culturais este fim de semana"',
              },
              limit: {
                type: 'number',
                description: 'Número máximo de resultados (opcional, padrão: 10, máximo: 50)',
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_artists',
          description: 'Lista todos os artistas cadastrados no sistema.',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_artist_by_id',
          description: 'Obter detalhes completos de um artista pelo ID. Retorna informações do artista incluindo eventos nos quais participa.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID do artista (UUID)' },
            },
            required: ['id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_artists_by_query',
          description: 'Busca EXATA por artista usando filtros específicos. Use quando: 1) Query é nome artístico específico conhecido, 2) Query menciona nome completo específico, 3) Query menciona username de rede social específico, 4) Query curta (1-3 palavras) que parece nome próprio. Exemplos: "Nome Artístico", "João Silva", "artistname" (username). NÃO use para descrições genéricas.',
          parameters: {
            type: 'object',
            properties: {
              artisticName: {
                type: 'string',
                description: 'Nome artístico do artista (busca parcial case-insensitive)',
              },
              name: {
                type: 'string',
                description: 'Nome completo do artista (busca parcial case-insensitive)',
              },
              instagramUsername: {
                type: 'string',
                description: 'Nome de usuário do Instagram',
              },
              youtubeUsername: {
                type: 'string',
                description: 'Nome de usuário do YouTube',
              },
              xUsername: {
                type: 'string',
                description: 'Nome de usuário do X/Twitter',
              },
              spotifyUsername: {
                type: 'string',
                description: 'Nome de usuário do Spotify',
              },
              tiktokUsername: {
                type: 'string',
                description: 'Nome de usuário do TikTok',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_artists_rag',
          description: 'Busca SEMÂNTICA de artistas por similaridade. Use quando: 1) Query é descrição genérica (ex: "artista de música gospel"), 2) Query combina características (ex: "cantor sertanejo", "banda de rock"), 3) Query é frase conversacional (ex: "quero encontrar artistas cristãos"), 4) Busca por conceito/estilo/categoria. Use esta ferramenta para buscar por significado, não por nome exato.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Query descritiva de busca semântica. Exemplos: "artista de música gospel", "cantor sertanejo", "banda de rock", "músico cristão"',
              },
              limit: {
                type: 'number',
                description: 'Número máximo de resultados (opcional, padrão: 10, máximo: 50)',
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  private mapAgentToolToMcp(name: string): string {
    if (name === 'events_search' || name === 'events.search') return 'list_events';
    if (name === 'get_ticket_prices_by_event' || name === 'events.ticket_prices') return 'get_event_ticket_categories';
    if (name === 'search_events_by_query' || name === 'events.search_query') return 'search_events_by_query';
    if (name === 'search_events_rag' || name === 'events.search_rag' || name === 'events.semantic_search') return 'search_events_rag';
    if (name === 'list_artists' || name === 'artists.list') return 'list_artists';
    if (name === 'get_artist_by_id' || name === 'artists.get_by_id') return 'get_artist_by_id';
    if (name === 'search_artists_by_query' || name === 'artists.search_query') return 'search_artists_by_query';
    if (name === 'search_artists_rag' || name === 'artists.search_rag' || name === 'artists.semantic_search') return 'search_artists_rag';
    return name;
  }

  private async callMcpTool(name: string, args: Record<string, unknown>) {
    const body: any = { name, arguments: args };
    if (this.mcpServerToken) body.authToken = this.mcpServerToken;
    const url = `${this.mcpBridgeBase}/tools/call`;
    const res = await axios.post(url, body, { timeout: this.requestTimeoutMs });
    return res.data;
  }

  private async callOpenAI(messages: OpenAIMessage[], tools: any) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.openaiApiKey}`,
    };
    const body = {
      model: this.openaiModel,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
    } as any;

    const res = await axios.post(url, body, { headers, timeout: this.requestTimeoutMs });
    return res.data;
  }

  private buildFallbackAnswerFromTools(toolsUsed: { name: string; arguments?: Record<string, unknown> }[]): string {
    if (!toolsUsed.length) return 'Não foi possível concluir a resposta no momento.';
    const calls = toolsUsed.map(t => `${t.name}${t.arguments ? ' ' + JSON.stringify(t.arguments) : ''}`).join('; ');
    return `Resultados de ferramentas obtidos. Não foi possível completar a redação final. Ferramentas usadas: ${calls}.`;
  }

  private safeJsonParse(s: string): Record<string, unknown> {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(value);
  }
}


