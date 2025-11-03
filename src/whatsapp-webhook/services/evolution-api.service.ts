import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvolutionClient } from '@solufy/evolution-sdk';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

@Injectable()
export class EvolutionApiService implements OnModuleInit {
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
   * Inicializa o cliente Evolution SDK após a criação do módulo
   */
  onModuleInit() {
    try {
      // O SDK será inicializado por instância quando necessário
      // Isso permite usar diferentes instâncias dinamicamente
      this.logger.info('[INIT] EvolutionApiService inicializado com SDK', {
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey,
      });
    } catch (error) {
      this.logger.error('[ERROR] Erro ao inicializar EvolutionApiService', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtém ou cria uma instância do EvolutionClient para uma instância específica
   * @param instanceName Nome da instância do Evolution API
   * @returns EvolutionClient configurado
   */
  private getClient(instanceName: string): EvolutionClient {
    // Criar novo cliente para cada instância (o SDK gerencia conexões)
    return new EvolutionClient({
      serverUrl: this.baseUrl,
      instance: instanceName,
      token: this.apiKey,
    });
  }

  /**
   * Envia mensagem de texto via Evolution API usando SDK
   * @param instanceName Nome da instância do Evolution API (ex: "Gwan")
   * @param number Número do WhatsApp do destinatário (ex: "5511987221050@s.whatsapp.net")
   * @param text Texto da mensagem a ser enviada
   */
  async sendTextMessage(instanceName: string, number: string, text: string): Promise<void> {
    const startTime = Date.now();

    this.logger.info('[SEND] Enviando mensagem via Evolution API SDK', {
      instanceName,
      number,
      textLength: text.length,
      baseUrl: this.baseUrl,
    });

    try {
      const client = this.getClient(instanceName);

      // Usar o método sendText do SDK
      const response = await client.messages.sendText({
        number,
        text,
      });

      const duration = Date.now() - startTime;
      this.logger.info('[SUCCESS] Mensagem enviada com sucesso via Evolution API SDK', {
        instanceName,
        number,
        response,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('[ERROR] Erro ao enviar mensagem via Evolution API SDK', {
        instanceName,
        number,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      // Propagar erro para tratamento no serviço que chamou
      throw error;
    }
  }
}
