import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatModelCompletion, ChatModelProvider, OpenAIMessage } from '../../interfaces/chat-model.interface';

@Injectable()
export class ClaudeChatProviderService implements ChatModelProvider {
  private readonly logger = new Logger(ClaudeChatProviderService.name);
  private readonly claudeApiKey: string;
  private readonly claudeModel: string;
  private readonly fallbackClaudeModels: string[];
  private readonly requestTimeoutMs = 30000;

  constructor(private readonly config: ConfigService) {
    this.claudeApiKey = this.config.get<string>('CLAUDE_API_KEY') || '';
    this.claudeModel = this.config.get<string>('CLAUDE_MODEL') || 'claude-haiku-4-5';
    this.fallbackClaudeModels = this.resolveFallbackModels();
  }

  async complete(messages: OpenAIMessage[], tools: any[], systemPrompt: string): Promise<ChatModelCompletion> {
    if (!this.claudeApiKey) {
      throw new Error('CLAUDE_API_KEY não configurada no ambiente.');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.claudeApiKey,
      'anthropic-version': '2023-06-01',
    };

    const claudeMessages = this.convertOpenAiMessagesToClaude(messages);
    const claudeTools = (tools || []).map((tool: any) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));

    const modelsToTry = [this.claudeModel, ...this.fallbackClaudeModels].filter(
      (model, index, arr) => !!model && arr.indexOf(model) === index,
    );

    let lastError: unknown;

    for (const currentModel of modelsToTry) {
      const body: any = {
        model: currentModel,
        system: systemPrompt,
        messages: claudeMessages,
        max_tokens: 1200,
        temperature: 0.2,
        tools: claudeTools.length > 0 ? claudeTools : undefined,
      };

      try {
        const res = await axios.post(url, body, { headers, timeout: this.requestTimeoutMs });
        if (currentModel !== this.claudeModel) {
          this.logger.warn(
            `Modelo Claude principal "${this.claudeModel}" indisponível; usando fallback "${currentModel}".`,
          );
        }
        return this.convertClaudeToOpenAiLikeResponse(res.data);
      } catch (error) {
        lastError = error;
        if (!this.isModelNotFoundError(error)) {
          this.logClaudeApiError(error, currentModel, body);
          throw this.toClaudeError(error);
        }

        this.logger.warn(`Modelo Claude não encontrado: "${currentModel}". Tentando próximo fallback...`);
      }
    }

    if (lastError) {
      throw new Error(
        `Nenhum modelo Claude disponível. Modelos tentados: ${modelsToTry.join(', ')}. Ajuste CLAUDE_MODEL/CLAUDE_FALLBACK_MODELS no .env.`,
      );
    }

    throw new Error('Não foi possível chamar Claude por erro desconhecido.');
  }

  private convertOpenAiMessagesToClaude(messages: OpenAIMessage[]): any[] {
    const claudeMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue;

      if (msg.role === 'user') {
        claudeMessages.push({ role: 'user', content: msg.content || '' });
        continue;
      }

      if (msg.role === 'assistant') {
        if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          const content = msg.tool_calls.map((tc: any) => ({
            type: 'tool_use',
            id: tc.id,
            name: tc.function?.name,
            input: this.safeJsonParse(tc.function?.arguments || '{}'),
          }));
          claudeMessages.push({ role: 'assistant', content });
        } else {
          claudeMessages.push({ role: 'assistant', content: msg.content || '' });
        }
        continue;
      }

      if (msg.role === 'tool') {
        claudeMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.tool_call_id,
              content: msg.content || '',
            },
          ],
        });
      }
    }

    return claudeMessages;
  }

  private convertClaudeToOpenAiLikeResponse(claudeResponse: any): ChatModelCompletion {
    const contentBlocks = Array.isArray(claudeResponse?.content) ? claudeResponse.content : [];
    const text = contentBlocks
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => block.text || '')
      .join('\n')
      .trim();

    const toolCalls = contentBlocks
      .filter((block: any) => block?.type === 'tool_use')
      .map((block: any) => ({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input || {}),
        },
      }));

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: text || null,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          },
        },
      ],
    };
  }

  private safeJsonParse(s: string): Record<string, unknown> {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }

  private resolveFallbackModels(): string[] {
    const configuredFallbacks = (this.config.get<string>('CLAUDE_FALLBACK_MODELS') || '')
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);

    const defaultFallbacks = [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6',
      'claude-opus-4-7',
    ];

    return [...configuredFallbacks, ...defaultFallbacks];
  }

  private isModelNotFoundError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;
    const type = error.response?.data?.error?.type;
    return status === 404 && type === 'not_found_error';
  }

  private logClaudeApiError(error: unknown, model: string, body: any): void {
    if (!axios.isAxiosError(error)) return;

    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestBody: {
        model,
        messagesCount: body.messages?.length,
        toolsCount: body.tools?.length,
      },
    };

    this.logger.error('[ERROR] Erro ao chamar Claude API', errorDetails);
  }

  private toClaudeError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      return new Error(`Erro ao chamar Claude: ${error.response?.data?.error?.message || error.message}`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
