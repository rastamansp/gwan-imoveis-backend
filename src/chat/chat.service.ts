import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';
import { ResponseFormatterService } from './services/response-formatter.service';
import { FormattedResponse } from './interfaces/chat-response.interface';

// Usamos any para permitir propriedades específicas do OpenAI (ex.: tool_calls)
type OpenAIMessage = any;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
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

          // Filtrar campos sensíveis ou desnecessários antes de serializar
          let filteredResult = result;

          // Serializar resultado para JSON string
          let resultContent = JSON.stringify(filteredResult);
          
          // Truncar resposta muito grande para evitar problemas com OpenAI
          // Mas garantir que o JSON seja válido (não cortar no meio de strings)
          const maxContentLength = 16000; // Limite de caracteres para resposta da ferramenta
          if (resultContent.length > maxContentLength) {
            // Se for array, tentar truncar mantendo array válido
            if (resultContent.startsWith('[')) {
              // Função para encontrar o último objeto completo antes do limite
              const findLastCompleteObject = (str: string, maxLen: number): number => {
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                let lastComma = -1;
                
                for (let i = 0; i < Math.min(str.length, maxLen); i++) {
                  const char = str[i];
                  
                  if (escapeNext) {
                    escapeNext = false;
                    continue;
                  }
                  
                  if (char === '\\') {
                    escapeNext = true;
                    continue;
                  }
                  
                  if (char === '"') {
                    inString = !inString;
                    continue;
                  }
                  
                  if (inString) continue;
                  
                  if (char === '{') depth++;
                  if (char === '}') depth--;
                  if (char === '[') depth++;
                  if (char === ']') depth--;
                  
                  // Se encontrou uma vírgula no nível raiz do array (depth === 1)
                  if (char === ',' && depth === 1) {
                    lastComma = i;
                  }
                }
                
                return lastComma;
              };
              
              // Tentar encontrar o último objeto completo
              const lastComma = findLastCompleteObject(resultContent, maxContentLength - 50);
              
              if (lastComma > 0) {
                // Truncar no último objeto completo (remover a vírgula se existir)
                const originalLength = resultContent.length;
                // Pegar até a vírgula (sem incluir a vírgula) e adicionar ]
                const truncated = resultContent.substring(0, lastComma) + ']';
                
                // Validar que o JSON truncado é válido
                try {
                  const parsed = JSON.parse(truncated);
                  if (Array.isArray(parsed)) {
                    resultContent = truncated;
                    this.logger.warn(`Resposta truncada de ${originalLength} para ${truncated.length} caracteres`);
                  } else {
                    throw new Error('Parsed result is not an array');
                  }
                } catch (parseError) {
                  // Se falhar, usar uma versão mais conservadora
                  this.logger.warn(`Falha ao validar JSON truncado, tentando versão conservadora: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                  const conservativeLimit = Math.floor(maxContentLength * 0.7);
                  const conservativeLastComma = findLastCompleteObject(resultContent, conservativeLimit);
                  if (conservativeLastComma > 0) {
                    // Remover vírgula antes de adicionar ]
                    const conservativeTruncated = resultContent.substring(0, conservativeLastComma) + ']';
                    try {
                      const parsed = JSON.parse(conservativeTruncated);
                      if (Array.isArray(parsed)) {
                        resultContent = conservativeTruncated;
                        this.logger.warn(`Resposta truncada para versão conservadora: ${conservativeTruncated.length} caracteres`);
                      } else {
                        throw new Error('Parsed result is not an array');
                      }
                    } catch {
                      resultContent = '[]';
                      this.logger.warn('Resposta muito grande, retornando array vazio');
                    }
                  } else {
                    // Último recurso: retornar array vazio com aviso
                    resultContent = '[]';
                    this.logger.warn('Resposta muito grande, retornando array vazio');
                  }
                }
              } else {
                // Não encontrou vírgula válida, tentar encontrar último objeto completo de outra forma
                // Procurar pelo último } que fecha um objeto no nível raiz
                let lastObjectEnd = -1;
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                
                for (let i = 0; i < Math.min(resultContent.length, maxContentLength - 10); i++) {
                  const char = resultContent[i];
                  
                  if (escapeNext) {
                    escapeNext = false;
                    continue;
                  }
                  
                  if (char === '\\') {
                    escapeNext = true;
                    continue;
                  }
                  
                  if (char === '"') {
                    inString = !inString;
                    continue;
                  }
                  
                  if (inString) continue;
                  
                  if (char === '{') depth++;
                  if (char === '}') {
                    depth--;
                    if (depth === 0 && i > 0) {
                      // Encontrou fechamento de objeto no nível raiz
                      lastObjectEnd = i + 1;
                    }
                  }
                  if (char === '[') depth++;
                  if (char === ']') depth--;
                }
                
                if (lastObjectEnd > 0) {
                  // Verificar se há vírgula depois do objeto
                  let nextCharIndex = lastObjectEnd;
                  while (nextCharIndex < resultContent.length && (resultContent[nextCharIndex] === ' ' || resultContent[nextCharIndex] === '\n' || resultContent[nextCharIndex] === '\r' || resultContent[nextCharIndex] === '\t')) {
                    nextCharIndex++;
                  }
                  
                  if (nextCharIndex < resultContent.length && resultContent[nextCharIndex] === ',') {
                    // Há vírgula depois, incluir ela e fechar array
                    const truncated = resultContent.substring(0, nextCharIndex) + ']';
                    try {
                      const parsed = JSON.parse(truncated);
                      if (Array.isArray(parsed)) {
                        resultContent = truncated;
                        this.logger.warn(`Resposta truncada usando último objeto: ${truncated.length} caracteres`);
                      } else {
                        throw new Error('Parsed result is not an array');
                      }
                    } catch {
                      // Se falhar, usar até o objeto sem vírgula
                      const truncated = resultContent.substring(0, lastObjectEnd) + ']';
                      try {
                        JSON.parse(truncated);
                        resultContent = truncated;
                        this.logger.warn(`Resposta truncada usando último objeto (sem vírgula): ${truncated.length} caracteres`);
                      } catch {
                        resultContent = '[]';
                        this.logger.warn('Resposta muito grande, retornando array vazio');
                      }
                    }
                  } else {
                    // Não há vírgula, apenas fechar array
                    const truncated = resultContent.substring(0, lastObjectEnd) + ']';
                    try {
                      const parsed = JSON.parse(truncated);
                      if (Array.isArray(parsed)) {
                        resultContent = truncated;
                        this.logger.warn(`Resposta truncada usando último objeto: ${truncated.length} caracteres`);
                      } else {
                        throw new Error('Parsed result is not an array');
                      }
                    } catch {
                      resultContent = '[]';
                      this.logger.warn('Resposta muito grande, retornando array vazio');
                    }
                  }
                } else {
                  resultContent = '[]';
                  this.logger.warn('Resposta muito grande, retornando array vazio');
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
        rawData = this.extractRawDataFromToolResults(toolResults);
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

  private async callOpenAI(messages: OpenAIMessage[], tools: any) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.openaiApiKey}`,
    };
    const body = {
      model: this.openaiModel,
      messages,
      tools: tools && tools.length > 0 ? tools : undefined,
      tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
      temperature: 0.2,
    } as any;

    try {
      const res = await axios.post(url, body, { headers, timeout: this.requestTimeoutMs });
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          requestBody: {
            model: body.model,
            messagesCount: body.messages?.length,
            toolsCount: body.tools?.length,
            tools: body.tools,
          },
        };
        this.logger.error('[ERROR] Erro ao chamar OpenAI API', errorDetails);
        throw new Error(`Erro ao chamar OpenAI: ${error.response?.data?.error?.message || error.message}`);
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
              this.logger.warn('Erro ao fazer parse do JSON da ferramenta:', {
                contentLength: content.length,
                contentPreview: content.substring(0, 200),
                error: parseError instanceof Error ? parseError.message : String(parseError),
              });
              
              // Tentar encontrar arrays JSON válidos no conteúdo
              // Procurar por arrays que começam com [
              const arrayStart = content.indexOf('[');
              if (arrayStart !== -1) {
                // Função para encontrar o final válido do array, respeitando strings e objetos
                const findValidArrayEnd = (str: string, start: number): number => {
                  let depth = 0;
                  let inString = false;
                  let escapeNext = false;
                  
                  for (let i = start; i < str.length; i++) {
                    const char = str[i];
                    
                    if (escapeNext) {
                      escapeNext = false;
                      continue;
                    }
                    
                    if (char === '\\') {
                      escapeNext = true;
                      continue;
                    }
                    
                    if (char === '"') {
                      inString = !inString;
                      continue;
                    }
                    
                    if (inString) continue;
                    
                    if (char === '{') depth++;
                    if (char === '}') depth--;
                    if (char === '[') depth++;
                    if (char === ']') {
                      depth--;
                      if (depth === 0) {
                        return i + 1;
                      }
                    }
                  }
                  
                  return -1; // Não encontrou final válido
                };
                
                const arrayEnd = findValidArrayEnd(content, arrayStart);
                
                if (arrayEnd > arrayStart) {
                  const partialJson = content.substring(arrayStart, arrayEnd);
                  try {
                    data = JSON.parse(partialJson);
                    this.logger.debug(`JSON recuperado com sucesso após truncamento: ${partialJson.length} caracteres`);
                  } catch (recoveryError) {
                    // Se ainda falhar, tentar encontrar o último objeto completo antes do erro
                    this.logger.warn(`Falha ao recuperar JSON truncado: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
                    
                    // Tentar encontrar última vírgula válida antes do erro
                    let lastValidComma = -1;
                    let depth = 0;
                    let inString = false;
                    let escapeNext = false;
                    
                    for (let i = arrayStart; i < arrayEnd; i++) {
                      const char = content[i];
                      
                      if (escapeNext) {
                        escapeNext = false;
                        continue;
                      }
                      
                      if (char === '\\') {
                        escapeNext = true;
                        continue;
                      }
                      
                      if (char === '"') {
                        inString = !inString;
                        continue;
                      }
                      
                      if (inString) continue;
                      
                      if (char === '{') depth++;
                      if (char === '}') depth--;
                      if (char === '[') depth++;
                      if (char === ']') depth--;
                      
                      if (char === ',' && depth === 1) {
                        lastValidComma = i;
                      }
                    }
                    
                    if (lastValidComma > arrayStart) {
                      const recoveredJson = content.substring(arrayStart, lastValidComma + 1) + ']';
                      try {
                        data = JSON.parse(recoveredJson);
                        this.logger.debug(`JSON recuperado após encontrar última vírgula válida: ${recoveredJson.length} caracteres`);
                      } catch {
                        return null;
                      }
                    } else {
                      return null;
                    }
                  }
                } else {
                  // Não encontrou final válido, tentar recuperar até última vírgula válida
                  let lastValidComma = -1;
                  let depth = 0;
                  let inString = false;
                  let escapeNext = false;
                  
                  for (let i = arrayStart; i < content.length; i++) {
                    const char = content[i];
                    
                    if (escapeNext) {
                      escapeNext = false;
                      continue;
                    }
                    
                    if (char === '\\') {
                      escapeNext = true;
                      continue;
                    }
                    
                    if (char === '"') {
                      inString = !inString;
                      continue;
                    }
                    
                    if (inString) continue;
                    
                    if (char === '{') depth++;
                    if (char === '}') depth--;
                    if (char === '[') depth++;
                    if (char === ']') depth--;
                    
                    if (char === ',' && depth === 1) {
                      lastValidComma = i;
                    }
                  }
                  
                  if (lastValidComma > arrayStart) {
                    const recoveredJson = content.substring(arrayStart, lastValidComma + 1) + ']';
                    try {
                      data = JSON.parse(recoveredJson);
                      this.logger.debug(`JSON recuperado parcialmente: ${recoveredJson.length} caracteres`);
                    } catch {
                      return null;
                    }
                  } else {
                    return null;
                  }
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
          
          // Se tiver propriedade 'properties' ou 'data', usar ela
          if (data.properties) {
            return Array.isArray(data.properties) ? data.properties : [data.properties];
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
          // Ignorar erros de parsing silenciosamente
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

}


