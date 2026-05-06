import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';
import { ResponseFormatterService } from './services/response-formatter.service';
import { FormattedResponse } from './interfaces/chat-response.interface';
import { OpenAIMessage } from './interfaces/chat-model.interface';
import { ChatModelRouterService } from './services/providers/chat-model-router.service';
import { ChatToolResultService } from './services/chat-tool-result.service';

// Usamos any para permitir propriedades específicas do OpenAI (ex.: tool_calls)

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly mcpBridgeBase: string;
  private readonly mcpServerToken?: string;
  private readonly maxToolIterations = 3;
  private readonly requestTimeoutMs = 30000; // 30 segundos para operações que podem demorar mais

  constructor(
    private readonly config: ConfigService,
    @Inject(ResponseFormatterService)
    private readonly responseFormatter: ResponseFormatterService,
    private readonly chatModelRouter: ChatModelRouterService,
    private readonly chatToolResultService: ChatToolResultService,
  ) {
    // Usar MCP_BRIDGE_BASE se definido, senão construir a partir de MCP_BASE_URL ou PORT
    const mcpBridgeBaseEnv = this.config.get<string>('MCP_BRIDGE_BASE');
    const mcpBaseUrl = this.config.get<string>('MCP_BASE_URL');
    const port = this.config.get<string>('PORT') || '3001';
    
    if (mcpBridgeBaseEnv) {
      this.mcpBridgeBase = mcpBridgeBaseEnv;
    } else if (mcpBaseUrl) {
      // Se MCP_BASE_URL estiver definido, usar ele + /api/mcp
      this.mcpBridgeBase = `${mcpBaseUrl}/api/mcp`;
    } else {
      // Fallback: usar localhost com a porta do servidor
      this.mcpBridgeBase = `http://localhost:${port}/api/mcp`;
    }
    
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
    let completion = await this.chatModelRouter.complete(messages, tools, systemPrompt);

    while (iteration < this.maxToolIterations && completion?.choices?.[0]?.message?.tool_calls?.length) {
      const assistantMsg = completion.choices[0].message;
      const toolCalls = assistantMsg.tool_calls || [];

      // É essencial manter a mensagem do assistente com tool_calls no histórico
      messages.push(assistantMsg);

      for (const tc of toolCalls) {
        const toolName = tc.function.name;
        const args = this.chatToolResultService.safeJsonParse(tc.function.arguments || '{}');

        // Mapear alias do agente para o nome real da tool MCP
        const mcpToolName = this.mapAgentToolToMcp(toolName);

        // Validação preventiva de UUID quando a tool exige 'id'
        if (mcpToolName === 'get_property_by_id') {
          const candidateId = String((args as any)?.id || '');
          if (!this.isValidUuid(candidateId)) {
            const answer = 'ID de imóvel inválido. Forneça um UUID válido ou peça para listar imóveis para escolher um ID.';
            return { answer, toolsUsed };
          }
        }

        try {
          const result = await this.callMcpTool(mcpToolName, args);
          toolsUsed.push({ name: toolName, arguments: args });
          const resultContent = this.chatToolResultService.serializeToolResult(result);

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
        completion = await this.chatModelRouter.complete(messages, tools, systemPrompt);
      } catch (err) {
        // Log do erro para debug
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Erro ao chamar provedor de IA após usar ferramentas:`, errorMessage);
        
        // Tentar construir uma resposta básica com base nos resultados das ferramentas
        // Se tivermos resultados de ferramentas, tentar formatá-los
        const toolResults = messages.filter(m => m.role === 'tool');
        if (toolResults.length > 0) {
          try {
            // Extrair dados brutos usando a mesma lógica do fluxo normal
            const rawData = this.chatToolResultService.extractRawDataFromToolResults(toolResults);

            if (rawData && toolsUsed.length > 0) {
              // Construir resposta simples baseada nos resultados
              const lastToolName = toolsUsed[toolsUsed.length - 1].name;
              const mcpToolName = this.mapAgentToolToMcp(lastToolName);
              const answer = this.buildAnswerFromToolResults(mcpToolName, [rawData]);
              
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

    let answer = completion?.choices?.[0]?.message?.content || 'Sem resposta.';
    
    // Extrair dados brutos das ferramentas usadas para formatação
    let rawData: any = null;
    if (toolsUsed.length > 0) {
      const toolResults = messages.filter(m => m.role === 'tool');
      if (toolResults.length > 0) {
        rawData = this.chatToolResultService.extractRawDataFromToolResults(toolResults);
      }
    }
    
    
    // Formatar resposta se canal foi especificado
    let formattedResponse: FormattedResponse | undefined;
    if (channel) {
      formattedResponse = await this.responseFormatter.formatResponse(answer, channel, toolsUsed, rawData);
      
      // Se o formatter gerou um Markdown específico, usar ele como answer
      // Isso permite que o cliente web renderize o Markdown corretamente
      if (formattedResponse?.answer && formattedResponse.answer !== answer) {
        // O formatter gerou um Markdown formatado, usar ele
        answer = formattedResponse.answer;
      }
    }
    
    return { answer, toolsUsed, formattedResponse };
  }

  private buildSystemPrompt(): string {
    return [
      'Você é um assistente especializado em imóveis da plataforma Litoral Imóveis.',
      'Responda às perguntas do usuário e utilize ferramentas quando precisar de dados atualizados.',
      '',
      'FERRAMENTAS DISPONÍVEIS:',
      '',
        'IMÓVEIS:',
        '- list_properties: Lista imóveis cadastrados com filtros opcionais (cidade, tipo, finalidade, preço mínimo/máximo, realtor)',
        '  * Filtros disponíveis:',
        '    - city: Filtrar por cidade (ex: "São Sebastião")',
        '    - type: Filtrar por tipo (CASA, APARTAMENTO, TERRENO, SALA_COMERCIAL)',
        '    - purpose: Filtrar por finalidade (RENT=Aluguel, SALE=Venda, INVESTMENT=Investimento)',
        '    - minPrice: Preço mínimo (ex: 300000)',
        '    - maxPrice: Preço máximo (ex: 1000000)',
        '    - realtorId: Filtrar por realtor específico (UUID)',
        '  * Exemplos de uso:',
        '    - "Liste imóveis em São Sebastião" → usar city="São Sebastião"',
        '    - "Mostre casas à venda" → usar type="CASA", purpose="SALE"',
        '    - "Busque imóveis para aluguel" → usar purpose="RENT"',
        '    - "Busque imóveis entre 300 mil e 500 mil" → usar minPrice=300000, maxPrice=500000',
        '    - "Imóveis com piscina" → usar list_properties e filtrar resultados por comodidades',
      '- get_property_by_id: Obtém detalhes completos de um imóvel específico pelo UUID',
      '  * Use quando o usuário solicitar detalhes de um imóvel específico ou mencionar um ID',
      '  * Exemplos: "Mostre os detalhes do imóvel {id}", "Quero ver mais informações sobre esse imóvel"',
      '',
      'CAMPOS DISPONÍVEIS EM IMÓVEIS:',
      '- Informações básicas: título, descrição, tipo, finalidade (RENT=Aluguel, SALE=Venda, INVESTMENT=Investimento), preço, cidade, bairro',
      '- Características: área (m²), quartos, banheiros, vagas de garagem',
      '- Comodidades: piscina, hidromassagem, frente mar, jardim, área gourmet, mobiliado',
      '- Imagens: imagem de capa e galeria de imagens',
      '- Realtor: informações do realtor responsável',
      '',
        'Quando retornar dados, seja objetivo e, se útil, sintetize os resultados:',
        '- Para imóveis: título, tipo, finalidade (Aluguel/Venda/Investimento), cidade, bairro, preço, área, quartos, banheiros, comodidades principais',
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
          name: 'list_properties',
          description: 'Lista imóveis cadastrados com filtros opcionais (cidade, tipo, faixa de preço, realtor).',
          parameters: {
            type: 'object',
            properties: {
              city: { 
                type: 'string', 
                description: 'Filtrar por cidade (ex: "São Sebastião")' 
              },
              type: { 
                type: 'string', 
                description: 'Filtrar por tipo (CASA, APARTAMENTO, TERRENO, SALA_COMERCIAL)',
                enum: ['CASA', 'APARTAMENTO', 'TERRENO', 'SALA_COMERCIAL'],
              },
              purpose: { 
                type: 'string', 
                description: 'Filtrar por finalidade (RENT=Aluguel, SALE=Venda, INVESTMENT=Investimento)',
                enum: ['RENT', 'SALE', 'INVESTMENT'],
              },
              minPrice: { 
                type: 'number', 
                description: 'Preço mínimo (ex: 300000)' 
              },
              maxPrice: { 
                type: 'number', 
                description: 'Preço máximo (ex: 1000000)' 
              },
              realtorId: { 
                type: 'string', 
                description: 'Filter by specific realtor (UUID)'
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_property_by_id',
          description: 'Obter detalhes completos de um imóvel pelo ID (UUID).',
          parameters: {
            type: 'object',
            properties: {
              id: { 
                type: 'string',
                description: 'ID do imóvel (UUID)',
              },
            },
            required: ['id'],
          },
        },
      },
    ];
  }

  private mapAgentToolToMcp(name: string): string {
    // O nome já está no formato correto (list_properties, get_property_by_id)
    // Não precisa mapear, apenas retornar o nome
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
        this.logger.error('[CHAT] Erro na resposta do MCP', {
          name,
          error: res.data.error,
        });
        throw new Error(res.data.error);
      }
      
      const result = res.data?.result || res.data;
      return result;
    } catch (error) {
      const errorDetails: any = {
        name,
        args,
        errorMessage: error instanceof Error ? error.message : String(error),
        isAxiosError: axios.isAxiosError(error),
      };
      
      if (axios.isAxiosError(error)) {
        errorDetails.axiosStatus = error.response?.status;
        errorDetails.axiosStatusText = error.response?.statusText;
        errorDetails.axiosData = error.response?.data;
        errorDetails.axiosHeaders = error.response?.headers;
        errorDetails.requestUrl = error.config?.url;
        errorDetails.requestMethod = error.config?.method;
        errorDetails.requestData = error.config?.data;
        errorDetails.code = error.code;
        errorDetails.message = error.message;
        errorDetails.stack = error.stack;
        
        // Log completo do erro
        this.logger.error('[CHAT] Erro completo ao chamar tool MCP', {
          ...errorDetails,
          fullError: JSON.stringify(errorDetails, null, 2),
        });
      } else {
        this.logger.error('[CHAT] Erro ao chamar tool MCP (não é AxiosError)', errorDetails);
      }
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Erro desconhecido ao chamar ferramenta';
        throw new Error(`Erro ao chamar ferramenta ${name}: ${errorMessage}`);
      }
      throw error;
    }
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
      
      if (toolName === 'list_properties') {
        const properties = Array.isArray(firstResult) ? firstResult : (firstResult?.data || firstResult?.properties || []);
        if (properties.length === 0) {
          return 'Não há imóveis cadastrados no sistema no momento.';
        }
        const propertyTitles = properties.slice(0, 10).map((p: any) => {
          const price = p.price ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
          const type = p.type || '';
          const city = p.city || '';
          return `${p.title || p.id}${type ? ` (${type})` : ''}${city ? ` - ${city}` : ''}${price ? ` - ${price}` : ''}`;
        }).join(', ');
        const moreText = properties.length > 10 ? ` (e mais ${properties.length - 10} imóvel(is))` : '';
        return `Encontrei ${properties.length} imóvel(is) cadastrado(s): ${propertyTitles}${moreText}.`;
      }

      if (toolName === 'get_property_by_id') {
        const property = Array.isArray(firstResult) ? firstResult[0] : (firstResult?.data || firstResult?.property || firstResult);
        if (!property) {
          return 'Imóvel não encontrado.';
        }
        const price = property.price ? `R$ ${Number(property.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
        const area = property.area ? `${property.area}m²` : '';
        const bedrooms = property.bedrooms ? `${property.bedrooms} quarto(s)` : '';
        const bathrooms = property.bathrooms ? `${property.bathrooms} banheiro(s)` : '';
        const details = [price, area, bedrooms, bathrooms].filter(Boolean).join(', ');
        return `Imóvel: ${property.title || property.id}${property.type ? ` (${property.type})` : ''}${property.city ? ` - ${property.city}` : ''}${details ? `. ${details}` : ''}.`;
      }

      // Para outras ferramentas, retornar null para usar fallback padrão
      return null;
    } catch (error) {
      return null;
    }
  }

  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(value);
  }

}


