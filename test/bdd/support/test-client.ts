import axios, { AxiosError } from 'axios';
import { ChatResponse } from './world';

/**
 * Cliente HTTP para testes do chatbot
 */
export class TestClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Enviar mensagem para o chatbot
   */
  public async sendMessage(
    message: string,
    userCtx?: Record<string, unknown>,
    sessionId?: string,
    phoneNumber?: string,
  ): Promise<{ response: ChatResponse; status: number }> {
    try {
      const body: any = {
        message,
      };

      if (userCtx) {
        body.userCtx = userCtx;
      }

      if (sessionId) {
        body.sessionId = sessionId;
      }

      if (phoneNumber) {
        body.phoneNumber = phoneNumber;
      }

      const response = await axios.post<ChatResponse>(
        `${this.baseUrl}/api/chat`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 segundos (aumentado para chat que pode demorar mais)
        },
      );

      return {
        response: response.data,
        status: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        throw new Error(
          axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao chamar API do chatbot',
        );
      }
      throw error;
    }
  }

  /**
   * Validar estrutura da resposta do chatbot
   */
  public validateResponse(response: ChatResponse): void {
    if (!response.answer) {
      throw new Error('Resposta do chatbot não contém campo "answer"');
    }

    if (typeof response.answer !== 'string') {
      throw new Error('Campo "answer" deve ser uma string');
    }

    if (response.toolsUsed) {
      if (!Array.isArray(response.toolsUsed)) {
        throw new Error('Campo "toolsUsed" deve ser um array');
      }

      for (const tool of response.toolsUsed) {
        if (!tool.name || typeof tool.name !== 'string') {
          throw new Error('Cada tool em "toolsUsed" deve ter um campo "name" string');
        }
      }
    }
  }

  /**
   * Extrair ferramentas usadas da resposta
   */
  public extractToolsUsed(response: ChatResponse): string[] {
    return response.toolsUsed?.map((tool) => tool.name) || [];
  }

  /**
   * Verificar se a resposta contém uma ferramenta específica
   */
  public responseContainsTool(response: ChatResponse, toolName: string): boolean {
    const toolsUsed = this.extractToolsUsed(response);
    return toolsUsed.includes(toolName);
  }

  /**
   * Verificar se a resposta contém um texto específico
   */
  public responseContainsText(response: ChatResponse, text: string): boolean {
    return response.answer.toLowerCase().includes(text.toLowerCase());
  }
}

