import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';
import { ResponseFormatterService } from './services/response-formatter.service';
import { FormattedResponse } from './interfaces/chat-response.interface';

// Usamos any para permitir propriedades específicas do OpenAI (ex.: tool_calls)
type OpenAIMessage = any;

@Injectable()
export class ChatService {
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;
  private readonly mcpBridgeBase: string;
  private readonly mcpServerToken?: string;
  private readonly maxToolIterations = 3;
  private readonly requestTimeoutMs = 30000; // 30 segundos para operações que podem demorar mais

  constructor(
    private readonly config: ConfigService,
    @Inject(ResponseFormatterService)
    private readonly responseFormatter: ResponseFormatterService,
  ) {
    this.openaiApiKey = this.config.get<string>('OPENAI_API_KEY')!;
    this.openaiModel = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    this.mcpBridgeBase = this.config.get<string>('MCP_BRIDGE_BASE') || 'http://localhost:3001/api/mcp';
    this.mcpServerToken = this.config.get<string>('MCP_AUTH_TOKEN');
  }

  public async chat(
    message: string,
    userCtx?: Record<string, unknown>,
    channel?: MessageChannel,
  ): Promise<{ answer: string; toolsUsed: { name: string; arguments?: Record<string, unknown> }[]; formattedResponse?: FormattedResponse }> {
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
        if (mcpToolName === 'get_user_tickets_by_event') {
          const candidateId = String((args as any)?.eventId || '');
          if (!this.isValidUuid(candidateId)) {
            const answer = 'ID de evento inválido. Forneça um UUID válido ou peça para listar eventos para escolher um ID.';
            return { answer, toolsUsed };
          }
          // Adicionar userId do contexto se disponível
          if (userCtx?.userId) {
            (args as any).userId = userCtx.userId;
          }
        }
        if (mcpToolName === 'get_artist_by_id') {
          const candidateId = String((args as any)?.id || '');
          if (!this.isValidUuid(candidateId)) {
            const answer = 'ID de artista inválido. Forneça um UUID válido ou peça para listar artistas para escolher um ID.';
            return { answer, toolsUsed };
          }
        }

        try {
          const result = await this.callMcpTool(mcpToolName, args);
          toolsUsed.push({ name: toolName, arguments: args });

          // Filtrar campos sensíveis ou desnecessários antes de serializar
          let filteredResult = result;
          
          // Se for lista de artistas (não busca por ID), remover campo spotify
          // get_artist_by_id mantém os dados completos do Spotify
          if (mcpToolName === 'list_artists' || mcpToolName === 'search_artists_by_query' || mcpToolName === 'search_artists_rag') {
            filteredResult = this.filterSpotifyFromArtists(result);
          }

          // Para get_user_tickets_by_event, remover qrCode base64 se existir (muito grande)
          if (mcpToolName === 'get_user_tickets_by_event') {
            if (filteredResult && typeof filteredResult === 'object') {
              if (Array.isArray(filteredResult.tickets)) {
                filteredResult.tickets = filteredResult.tickets.map((ticket: any) => {
                  const { qrCode, ...ticketWithoutQR } = ticket;
                  return ticketWithoutQR;
                });
              } else if (filteredResult.tickets && typeof filteredResult.tickets === 'object') {
                const { qrCode, ...ticketWithoutQR } = filteredResult.tickets;
                filteredResult.tickets = ticketWithoutQR;
              }
            }
          }

          // Serializar resultado para JSON string
          let resultContent = JSON.stringify(filteredResult);
          
          // Truncar resposta muito grande para evitar problemas com OpenAI
          // Mas garantir que o JSON seja válido (não cortar no meio de strings)
          const maxContentLength = 16000; // Limite de caracteres para resposta da ferramenta
          if (resultContent.length > maxContentLength) {
            // Se for array, tentar truncar mantendo array válido
            if (resultContent.startsWith('[')) {
              // Truncar array de forma inteligente
              let truncated = resultContent.substring(0, maxContentLength - 20); // Deixar espaço para fechar
              
              // Encontrar o último objeto/array completo antes do limite
              let lastComma = truncated.lastIndexOf(',');
              let lastBracket = truncated.lastIndexOf(']');
              
              // Se encontrou uma vírgula válida antes do limite, usar até lá
              if (lastComma > lastBracket && lastComma > truncated.length - 1000) {
                truncated = truncated.substring(0, lastComma + 1);
              }
              
              // Garantir que termine com ] válido
              if (!truncated.endsWith(']')) {
                truncated += ']';
              }
              
              // Tentar fazer parse para garantir que está válido
              try {
                JSON.parse(truncated);
                resultContent = truncated + '...[truncado]';
              } catch {
                // Se falhar, usar uma versão mais conservadora
                const conservativeLimit = Math.floor(maxContentLength * 0.8);
                const conservativeTruncated = resultContent.substring(0, conservativeLimit);
                const lastSafeComma = conservativeTruncated.lastIndexOf(',');
                if (lastSafeComma > 0) {
                  resultContent = conservativeTruncated.substring(0, lastSafeComma + 1) + ']...[truncado]';
                } else {
                  resultContent = '[]...[truncado - resposta muito grande]';
                }
              }
            } else {
              // Para objetos, truncar de forma similar
              resultContent = resultContent.substring(0, maxContentLength - 20) + '...[truncado]';
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: toolName,
            content: resultContent,
          });
        } catch (error) {
          // Se a chamada da ferramenta falhar, adicionar mensagem de erro e continuar
          const errorMessage = error instanceof Error ? error.message : String(error);
          toolsUsed.push({ name: toolName, arguments: args });

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: toolName,
            content: JSON.stringify({ error: `Erro ao executar ferramenta ${toolName}: ${errorMessage}` }),
          });
        }
      }

      try {
        completion = await this.callOpenAI(messages, tools);
      } catch (err) {
        // Log do erro para debug
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Erro ao chamar OpenAI após usar ferramentas:`, errorMessage);
        
        // Tentar construir uma resposta básica com base nos resultados das ferramentas
        // Se tivermos resultados de ferramentas, tentar formatá-los
        const toolResults = messages.filter(m => m.role === 'tool');
        if (toolResults.length > 0) {
          try {
            // Extrair dados brutos usando a mesma lógica do fluxo normal
            const rawData = this.extractRawDataFromToolResults(toolResults);

            if (rawData && toolsUsed.length > 0) {
              // Construir resposta simples baseada nos resultados
              const lastToolName = toolsUsed[toolsUsed.length - 1].name;
              const mcpToolName = this.mapAgentToolToMcp(lastToolName);
              const answer = this.buildAnswerFromToolResults(mcpToolName, [rawData]);
              
              // Para get_user_tickets_by_event, sempre formatar mesmo sem resposta do OpenAI
              if (mcpToolName === 'get_user_tickets_by_event' || !answer) {
                // Criar resposta padrão para formatação estruturada
                const defaultAnswer = 'Aqui estão seus ingressos para o evento solicitado.';
                
                // Formatar resposta se canal foi especificado
                let formattedResponse: FormattedResponse | undefined;
                if (channel) {
                  formattedResponse = await this.responseFormatter.formatResponse(
                    defaultAnswer, 
                    channel, 
                    toolsUsed, 
                    rawData
                  );
                }
                
                return { 
                  answer: answer || defaultAnswer, 
                  toolsUsed, 
                  formattedResponse 
                };
              }
              
              if (answer) {
                // Formatar resposta se canal foi especificado
                let formattedResponse: FormattedResponse | undefined;
                if (channel) {
                  formattedResponse = await this.responseFormatter.formatResponse(answer, channel, toolsUsed, rawData);
                }
                return { answer, toolsUsed, formattedResponse };
              }
            }
          } catch (parseError) {
            // Ignorar erros de parsing
          }
        }

        // Fallback: retornar síntese simples com base nas tools usadas
        const answer = this.buildFallbackAnswerFromTools(toolsUsed);
        return { answer, toolsUsed, formattedResponse: undefined };
      }
      iteration++;
    }

    const answer = completion?.choices?.[0]?.message?.content || 'Sem resposta.';
    
    // Extrair dados brutos das ferramentas usadas para formatação
    let rawData: any = null;
    if (toolsUsed.length > 0) {
      const toolResults = messages.filter(m => m.role === 'tool');
      if (toolResults.length > 0) {
        rawData = this.extractRawDataFromToolResults(toolResults);
      }
    }
    
    // Log detalhado para debug de artistas
    if (toolsUsed.some(t => t.name.includes('artist'))) {
      console.log('Debug - Extração de dados de artistas:', {
        toolsUsed: toolsUsed.map(t => t.name),
        rawDataType: rawData ? typeof rawData : 'undefined',
        rawDataIsArray: Array.isArray(rawData),
        rawDataLength: Array.isArray(rawData) ? rawData.length : rawData ? Object.keys(rawData).length : 0,
        rawDataSample: rawData ? (Array.isArray(rawData) ? rawData.slice(0, 2) : JSON.stringify(rawData).substring(0, 200)) : 'null',
      });
    }
    
    // Formatar resposta se canal foi especificado
    let formattedResponse: FormattedResponse | undefined;
    if (channel) {
      formattedResponse = await this.responseFormatter.formatResponse(answer, channel, toolsUsed, rawData);
    }
    
    return { answer, toolsUsed, formattedResponse };
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
      '- get_user_tickets_by_event: Obtém ingressos do usuário para um evento específico. Use quando usuário solicitar seus ingressos de um evento (ex: "me envie o ingresso do evento", "mostre meus ingressos para o evento"). O userId é obtido automaticamente do contexto.',
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
          name: 'get_user_tickets_by_event',
          description: 'Obter ingressos do usuário para um evento específico. Use quando usuário solicitar seus ingressos de um evento (ex: "me envie o ingresso do evento", "mostre meus ingressos para o evento"). O userId será obtido automaticamente do contexto do WhatsApp.',
          parameters: {
            type: 'object',
            properties: {
              eventId: { 
                type: 'string',
                description: 'ID do evento (UUID)',
              },
            },
            required: ['eventId'],
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
    if (name === 'get_user_tickets_by_event' || name === 'user.tickets_by_event') return 'get_user_tickets_by_event';
    if (name === 'search_events_by_query' || name === 'events.search_query') return 'search_events_by_query';
    if (name === 'search_events_rag' || name === 'events.search_rag' || name === 'events.semantic_search') return 'search_events_rag';
    if (name === 'list_artists' || name === 'artists.list') return 'list_artists';
    if (name === 'get_artist_by_id' || name === 'artists.get_by_id') return 'get_artist_by_id';
    if (name === 'search_artists_by_query' || name === 'artists.search_query') return 'search_artists_by_query';
    if (name === 'search_artists_rag' || name === 'artists.search_rag' || name === 'artists.semantic_search') return 'search_artists_rag';
    return name;
  }

  private async callMcpTool(name: string, args: Record<string, unknown>) {
    try {
      const body: any = { name, arguments: args };
      if (this.mcpServerToken) body.authToken = this.mcpServerToken;
      const url = `${this.mcpBridgeBase}/tools/call`;
      const res = await axios.post(url, body, { timeout: this.requestTimeoutMs });
      
      // Verificar se a resposta contém erro
      if (res.data?.error) {
        throw new Error(res.data.error);
      }
      
      return res.data?.result || res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido ao chamar ferramenta';
        throw new Error(`Erro ao chamar ferramenta ${name}: ${errorMessage}`);
      }
      throw error;
    }
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

  private buildAnswerFromToolResults(toolName: string, results: any[]): string | null {
    if (!results || results.length === 0) return null;

    try {
      // Se o primeiro resultado já for um array, usar diretamente
      const firstResult = results[0];
      
      if (toolName === 'list_artists' || toolName === 'artists.list') {
        const artists = Array.isArray(firstResult) ? firstResult : (firstResult?.data || firstResult?.artists || []);
        if (artists.length === 0) {
          return 'Não há artistas cadastrados no sistema no momento.';
        }
        const artistNames = artists.slice(0, 10).map((a: any) => 
          a.artisticName || a.name || a.id
        ).join(', ');
        const moreText = artists.length > 10 ? ` (e mais ${artists.length - 10} artista(s))` : '';
        return `Encontrei ${artists.length} artista(s) cadastrado(s): ${artistNames}${moreText}.`;
      }

      if (toolName === 'list_events' || toolName === 'events.search') {
        const events = Array.isArray(firstResult) ? firstResult : (firstResult?.data || firstResult?.events || []);
        if (events.length === 0) {
          return 'Não há eventos cadastrados no sistema no momento.';
        }
        const eventTitles = events.slice(0, 10).map((e: any) => 
          e.title || e.name || e.id
        ).join(', ');
        const moreText = events.length > 10 ? ` (e mais ${events.length - 10} evento(s))` : '';
        return `Encontrei ${events.length} evento(s) cadastrado(s): ${eventTitles}${moreText}.`;
      }

      if (toolName === 'get_user_tickets_by_event' || toolName === 'user.tickets_by_event') {
        // Para ingressos do usuário, deixar o formato ser feito pelo WhatsAppFormatterService
        // Retornar null para que o sistema use o formato estruturado
        return null;
      }

      // Para outras ferramentas, retornar null para usar fallback padrão
      return null;
    } catch (error) {
      return null;
    }
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

  /**
   * Extrai dados brutos dos resultados das ferramentas, tratando arrays, objetos e JSON truncado
   */
  private extractRawDataFromToolResults(toolResults: any[]): any {
    if (!toolResults || toolResults.length === 0) return null;

    try {
      const results = toolResults.map((m: any) => {
        try {
          const content = m.content;
          if (!content) return null;
          
          // Tentar fazer parse do JSON
          let data: any;
          
          // Se já for objeto, usar diretamente
          if (typeof content === 'object') {
            data = content;
          } else if (typeof content === 'string') {
            // Tentar fazer parse do JSON
            try {
              data = JSON.parse(content);
            } catch (parseError) {
              // Se o JSON estiver truncado, tentar recuperar o que for possível
              console.error('Erro ao fazer parse do JSON da ferramenta:', {
                contentLength: content.length,
                contentPreview: content.substring(0, 200),
                error: parseError instanceof Error ? parseError.message : String(parseError),
              });
              
              // Tentar encontrar arrays JSON válidos no conteúdo
              // Procurar por arrays que começam com [
              const arrayStart = content.indexOf('[');
              if (arrayStart !== -1) {
                // Tentar encontrar o final do array mais próximo
                let bracketCount = 0;
                let arrayEnd = -1;
                for (let i = arrayStart; i < content.length; i++) {
                  if (content[i] === '[') bracketCount++;
                  if (content[i] === ']') bracketCount--;
                  if (bracketCount === 0) {
                    arrayEnd = i + 1;
                    break;
                  }
                }
                
                if (arrayEnd > arrayStart) {
                  const partialJson = content.substring(arrayStart, arrayEnd);
                  try {
                    data = JSON.parse(partialJson);
                    console.log('Recuperado JSON parcial:', { 
                      length: partialJson.length,
                      itemCount: Array.isArray(data) ? data.length : 0 
                    });
                  } catch {
                    // Se ainda falhar, retornar null
                    return null;
                  }
                } else {
                  return null;
                }
              } else {
                return null;
              }
            }
          } else {
            return null;
          }
          
          if (data.error) return null;
          
          // Se for array, retornar diretamente
          if (Array.isArray(data)) {
            return data;
          }
          
          // Tratar estruturas específicas de retorno de tools
          // Para get_user_tickets_by_event, retornar objeto completo { tickets, event }
          if (data.tickets && typeof data.tickets === 'object') {
            // Retornar objeto completo para formatação estruturada
            return data;
          }
          
          // Se tiver propriedade 'events', 'artists' ou 'data', usar ela
          if (data.events) {
            return Array.isArray(data.events) ? data.events : [data.events];
          }
          if (data.artists) {
            return Array.isArray(data.artists) ? data.artists : [data.artists];
          }
          if (data.data) {
            return Array.isArray(data.data) ? data.data : [data.data];
          }
          
          // Se for um objeto com chaves numéricas, converter para array
          if (typeof data === 'object' && !Array.isArray(data)) {
            const keys = Object.keys(data);
            const numericKeys = keys.filter(k => /^\d+$/.test(k));
            if (numericKeys.length > 0 && numericKeys.length === keys.length) {
              // É um objeto com chaves numéricas, converter para array
              return numericKeys.map(k => data[k]).filter(Boolean);
            }
          }
          
          return data;
        } catch (parseError) {
          // Logar erro de parsing para debug
          console.error('Erro ao fazer parse do resultado da ferramenta:', {
            content: typeof m.content === 'string' ? m.content.substring(0, 200) : m.content,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          return null;
        }
      }).filter(Boolean);
      
      if (results.length > 0) {
        // Se todos os resultados são arrays, concatenar
        const allArrays = results.every(r => Array.isArray(r));
        if (allArrays) {
          return results.flat();
        } else if (results.length === 1) {
          return results[0];
        } else {
          // Se há múltiplos resultados e não são todos arrays, usar o último
          return results[results.length - 1];
        }
      }
    } catch (error) {
      console.error('Erro ao extrair dados brutos das ferramentas:', error);
    }

    return null;
  }

  /**
   * Remove campos relacionados ao Spotify dos dados de artistas
   */
  private filterSpotifyFromArtists(data: any): any {
    if (!data) return data;

    // Se for array de artistas
    if (Array.isArray(data)) {
      return data.map(artist => this.removeSpotifyFields(artist));
    }

    // Se for um único artista
    return this.removeSpotifyFields(data);
  }

  /**
   * Remove campos relacionados ao Spotify de um objeto artista
   */
  private removeSpotifyFields(artist: any): any {
    if (!artist || typeof artist !== 'object') return artist;

    // Criar cópia do objeto sem os campos spotify
    // NÃO remover metadata completamente, apenas o campo spotify dentro dele
    const { spotify, spotifyUsername, metadata, ...filteredArtist } = artist;

    // Se metadata existir e tiver campo spotify, remover apenas o spotify
    if (metadata && typeof metadata === 'object') {
      const { spotify: spotifyMetadata, ...filteredMetadata } = metadata;
      // Manter metadata mesmo que só tenha spotify removido
      filteredArtist.metadata = filteredMetadata;
    } else if (artist.metadata) {
      // Se metadata existe mas não é objeto, manter como está
      filteredArtist.metadata = artist.metadata;
    }

    return filteredArtist;
  }
}


