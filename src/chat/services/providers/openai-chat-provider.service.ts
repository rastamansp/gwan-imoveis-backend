import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChatModelCompletion, ChatModelProvider, OpenAIMessage } from '../../interfaces/chat-model.interface';

@Injectable()
export class OpenAiChatProviderService implements ChatModelProvider {
  private readonly logger = new Logger(OpenAiChatProviderService.name);
  private readonly openaiApiKey: string;
  private readonly openaiModel: string;
  private readonly requestTimeoutMs = 30000;

  constructor(private readonly config: ConfigService) {
    this.openaiApiKey = this.config.get<string>('OPENAI_API_KEY') || '';
    this.openaiModel = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  async complete(messages: OpenAIMessage[], tools: any[], _systemPrompt: string): Promise<ChatModelCompletion> {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada no ambiente.');
    }

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
          },
        };
        this.logger.error('[ERROR] Erro ao chamar OpenAI API', errorDetails);
        throw new Error(`Erro ao chamar OpenAI: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }
}
