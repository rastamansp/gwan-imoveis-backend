import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProvider, ChatModelCompletion, OpenAIMessage } from '../../interfaces/chat-model.interface';
import { ClaudeChatProviderService } from './claude-chat-provider.service';
import { OpenAiChatProviderService } from './openai-chat-provider.service';

@Injectable()
export class ChatModelRouterService {
  private readonly provider: AiProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly openAiProvider: OpenAiChatProviderService,
    private readonly claudeProvider: ClaudeChatProviderService,
  ) {
    this.provider = (this.config.get<string>('AI_PROVIDER') || 'openai').toLowerCase() as AiProvider;
  }

  complete(messages: OpenAIMessage[], tools: any[], systemPrompt: string): Promise<ChatModelCompletion> {
    if (this.provider === 'claude') {
      return this.claudeProvider.complete(messages, tools, systemPrompt);
    }

    return this.openAiProvider.complete(messages, tools, systemPrompt);
  }
}
