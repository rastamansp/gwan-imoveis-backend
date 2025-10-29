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
      'Ferramentas disponíveis: events.search (lista eventos), get_event_by_id (detalhes), get_event_ticket_categories (categorias e preços), get_ticket_prices_by_event (alias para categorias/preços), search_events_by_query (busca por nome ou código).',
      'Quando o usuário fornecer um nome, palavra-chave ou um código amigável (formato EVT-XXXXXX), utilize a ferramenta search_events_by_query passando o campo "query" com o termo completo informado.',
      'Quando retornar dados, seja objetivo e, se útil, sintetize os resultados (título, data, local).',
    ].join(' ');
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
          description: 'Buscar eventos por nome (title) ou código (code).',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string' } },
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


