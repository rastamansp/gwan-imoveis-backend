import { Injectable, Inject } from '@nestjs/common';
import { MessageChannel } from '../../shared/domain/value-objects/message-channel.enum';
import { FormattedResponse } from '../interfaces/chat-response.interface';
import { WhatsAppFormatterService } from './formatters/whatsapp-formatter.service';
import { WebFormatterService } from './formatters/web-formatter.service';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

@Injectable()
export class ResponseFormatterService {
  constructor(
    private readonly whatsappFormatter: WhatsAppFormatterService,
    private readonly webFormatter: WebFormatterService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Formata resposta baseada no canal
   */
  async formatResponse(
    rawResponse: string,
    channel: MessageChannel,
    toolsUsed: { name: string; arguments?: Record<string, unknown> }[],
    rawData?: any,
  ): Promise<FormattedResponse> {
    try {
      switch (channel) {
        case MessageChannel.WHATSAPP:
          return await this.whatsappFormatter.format(rawResponse, toolsUsed, rawData);
        
        case MessageChannel.WEB:
          return await this.webFormatter.format(rawResponse, toolsUsed, rawData);
        
        default:
          this.logger.warn('Canal desconhecido, usando formatação genérica', { channel });
          return {
            answer: rawResponse,
            data: {
              type: 'generic',
            },
          };
      }
    } catch (error) {
      this.logger.error('Erro ao formatar resposta', {
        channel,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Fallback: retornar resposta bruta
      return {
        answer: rawResponse,
        data: {
          type: 'generic',
        },
      };
    }
  }
}

