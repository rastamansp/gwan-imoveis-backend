import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

interface SendTextMessagePayload {
  number: string;
  text: string;
  delay?: number;
  quoted?: {
    key?: {
      id: string;
    };
    message?: {
      conversation: string;
    };
  };
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

@Injectable()
export class EvolutionApiService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {
    this.baseUrl = this.configService.get<string>('EVOLUTION_INSTANCE_URL') || 'http://localhost:8080';
    // Usar EVOLUTION_INSTANCE como API key (conforme mencionado pelo usuário)
    this.apiKey = this.configService.get<string>('EVOLUTION_INSTANCE') || this.configService.get<string>('EVOLUTION_API_KEY') || '';

    if (!this.baseUrl) {
      this.logger.warn('EVOLUTION_INSTANCE_URL não configurada, usando valor padrão: http://localhost:8080');
    }

    if (!this.apiKey) {
      this.logger.warn('EVOLUTION_INSTANCE ou EVOLUTION_API_KEY não configurada. Requisições podem falhar por falta de autenticação.');
    }
  }

  /**
   * Envia mensagem de texto via Evolution API
   * @param instanceName Nome da instância do Evolution API (ex: "Gwan")
   * @param number Número do WhatsApp do destinatário (ex: "5511987221050@s.whatsapp.net")
   * @param text Texto da mensagem a ser enviada
   */
  async sendTextMessage(instanceName: string, number: string, text: string): Promise<void> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/message/sendText/${instanceName}`;

    const payload: SendTextMessagePayload = {
      number,
      text,
    };

    this.logger.info('[SEND] Enviando mensagem via Evolution API', {
      instanceName,
      number,
      textLength: text.length,
      url,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Adicionar API key no header (Evolution API usa 'apikey' como header)
      if (this.apiKey) {
        headers['apikey'] = this.apiKey;
      }

      const response = await axios.post(url, payload, {
        headers,
        timeout: 30000, // 30 segundos de timeout
      });

      const duration = Date.now() - startTime;
      this.logger.info('[SUCCESS] Mensagem enviada com sucesso via Evolution API', {
        instanceName,
        number,
        status: response.status,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error('[ERROR] Erro ao enviar mensagem via Evolution API', {
          instanceName,
          number,
          url,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message,
          duration,
        });
      } else {
        this.logger.error('[ERROR] Erro desconhecido ao enviar mensagem via Evolution API', {
          instanceName,
          number,
          url,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration,
        });
      }

      // Não propagar erro - apenas logar para não quebrar processamento do webhook
      throw error;
    }
  }
}
