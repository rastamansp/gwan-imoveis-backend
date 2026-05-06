export type OpenAIMessage = any;
export type AiProvider = 'openai' | 'claude';

export interface ChatModelCompletion {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
}

export interface ChatModelProvider {
  complete(
    messages: OpenAIMessage[],
    tools: any[],
    systemPrompt: string,
  ): Promise<ChatModelCompletion>;
}
