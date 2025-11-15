import axios, { AxiosError } from 'axios';

/**
 * Interface para resposta do chatbot de saúde
 */
export interface ChatHealthResponse {
  answer: string;
  disease?: {
    name: string;
    description: string;
    causes?: string | null;
    treatment?: string | null;
    plants?: string | null;
  } | null;
  similarity?: number;
  searchMethod: 'exact' | 'partial' | 'semantic' | 'hybrid';
  alternatives?: Array<{
    name: string;
    description: string;
    similarity: number;
  }>;
  sessionId?: string;
  formattedResponse?: any;
}

/**
 * Cliente HTTP para testes do chatbot de saúde
 */
export class ChatHealthTestClient {
  private readonly baseUrl: string;
  private sessionId?: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Enviar consulta para o chatbot de saúde
   */
  public async sendQuery(
    query: string,
    options?: {
      sessionId?: string;
      phoneNumber?: string;
      userCtx?: Record<string, unknown>;
    },
  ): Promise<{ response: ChatHealthResponse; status: number }> {
    try {
      const body: any = { query };
      
      if (options?.sessionId) {
        body.sessionId = options.sessionId;
      } else if (this.sessionId) {
        body.sessionId = this.sessionId;
      }
      
      if (options?.phoneNumber) {
        body.phoneNumber = options.phoneNumber;
      }
      
      if (options?.userCtx) {
        body.userCtx = options.userCtx;
      }

      const response = await axios.post<ChatHealthResponse>(
        `${this.baseUrl}/api/chat-health`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 segundos
        },
      );

      // Atualizar sessionId se retornado
      if (response.data.sessionId) {
        this.sessionId = response.data.sessionId;
      }

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
            'Erro ao chamar API do chatbot de saúde',
        );
      }
      throw error;
    }
  }

  /**
   * Validar estrutura da resposta do chatbot de saúde
   */
  public validateResponse(response: ChatHealthResponse): void {
    if (!response.answer) {
      throw new Error('Resposta do chatbot não contém campo "answer"');
    }

    if (typeof response.answer !== 'string') {
      throw new Error('Campo "answer" deve ser uma string');
    }

    if (!response.searchMethod) {
      throw new Error('Resposta do chatbot não contém campo "searchMethod"');
    }

    const validMethods = ['exact', 'partial', 'semantic', 'hybrid'];
    if (!validMethods.includes(response.searchMethod)) {
      throw new Error(
        `Campo "searchMethod" deve ser um dos valores: ${validMethods.join(', ')}`,
      );
    }
  }

  /**
   * Verificar se a resposta contém informações sobre doença
   */
  public responseContainsDiseaseInfo(response: ChatHealthResponse): boolean {
    return (
      response.answer.toLowerCase().includes('doença:') ||
      response.answer.toLowerCase().includes('descrição:') ||
      !!response.disease
    );
  }

  /**
   * Verificar se a resposta contém um texto específico
   */
  public responseContainsText(response: ChatHealthResponse, text: string): boolean {
    return response.answer.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Verificar se a resposta contém informações sobre plantas
   */
  public responseContainsPlants(response: ChatHealthResponse): boolean {
    return (
      response.answer.toLowerCase().includes('plantas indicadas:') ||
      response.answer.toLowerCase().includes('plantas medicinais') ||
      (response.disease?.plants && response.disease.plants.length > 0)
    );
  }

  /**
   * Verificar se a resposta contém informações sobre tratamento
   */
  public responseContainsTreatment(response: ChatHealthResponse): boolean {
    return (
      response.answer.toLowerCase().includes('tratamento:') ||
      (response.disease?.treatment && response.disease.treatment.length > 0)
    );
  }

  /**
   * Verificar se a resposta contém informações sobre causas
   */
  public responseContainsCauses(response: ChatHealthResponse): boolean {
    const lowerAnswer = response.answer.toLowerCase();
    
    // Verificar se a resposta contém palavras-chave relacionadas a causas
    const causeKeywords = ['causas:', 'causas', 'causa:', 'causa', 'origem', 'provoca', 'motivo'];
    const hasCauseKeyword = causeKeywords.some(keyword => lowerAnswer.includes(keyword));
    
    // Verificar se o campo disease.causes existe e não está vazio (é string, não array)
    const hasCauseField = response.disease?.causes && 
                         typeof response.disease.causes === 'string' && 
                         response.disease.causes.trim().length > 0;
    
    return hasCauseKeyword || hasCauseField || false;
  }

  /**
   * Limpar sessão
   */
  public clearSession(): void {
    this.sessionId = undefined;
  }

  /**
   * Obter sessionId atual
   */
  public getSessionId(): string | undefined {
    return this.sessionId;
  }
}

