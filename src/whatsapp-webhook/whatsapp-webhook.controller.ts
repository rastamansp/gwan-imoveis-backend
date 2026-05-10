import { Controller, Post, Body, HttpCode, HttpStatus, Headers, RawBodyRequest, Req, Inject, Logger, UsePipes, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { EvolutionWebhookDto } from './dtos/evolution-webhook.dto';
import { ILogger } from '../shared/application/interfaces/logger.interface';

@ApiTags('WhatsApp Webhook')
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly nestLogger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly whatsappWebhookService: WhatsappWebhookService,
    private readonly configService: ConfigService,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      whitelist: false, // Permite campos extras
      forbidNonWhitelisted: false, // Não rejeita campos não decorados
      transform: true, // Permite transformação
    }),
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para receber eventos da Evolution API',
    description: 'Endpoint para receber webhooks da Evolution API com eventos do WhatsApp (mensagens, conexões, QR codes, etc). Todos os eventos são logados estruturadamente.',
  })
  @ApiBody({
    description: 'Payload do webhook da Evolution API',
    type: EvolutionWebhookDto,
    examples: {
      messagesUpsert: {
        summary: 'Evento de mensagem recebida/enviada',
        value: {
          event: 'messages.upsert',
          instance: 'minha-instancia',
          data: {
            key: {
              remoteJid: '5511999999999@s.whatsapp.net',
              fromMe: false,
              id: '3EB0123456789ABCDEF',
            },
            message: {
              conversation: 'Olá, esta é uma mensagem de teste',
            },
            messageTimestamp: 1701234567,
            pushName: 'João Silva',
          },
        },
      },
      connectionUpdate: {
        summary: 'Evento de atualização de conexão',
        value: {
          event: 'connection.update',
          instance: 'minha-instancia',
          data: {
            state: 'open',
          },
        },
      },
      qrcodeUpdate: {
        summary: 'Evento de QR Code gerado',
        value: {
          event: 'qrcode.update',
          instance: 'minha-instancia',
          data: {
            qrcode: {
              base64: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
            },
            status: 'QRCODE_SCANNED',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook recebido e processado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Webhook processado com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido',
  })
  async receiveWebhook(
    @Body() body: any, // Aceitar qualquer payload para flexibilidade com Evolution API
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ success: boolean; message: string }> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Autenticação via header compartilhado com a Evolution API.
    // Quando WHATSAPP_WEBHOOK_SECRET está vazia, a checagem é desabilitada (apenas dev local).
    const expectedToken = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');
    if (expectedToken) {
      const providedToken =
        headers['x-evolution-token'] || headers['X-Evolution-Token' as keyof typeof headers];
      if (providedToken !== expectedToken) {
        this.logger.warn('[WEBHOOK] Tentativa de webhook sem token válido', {
          requestId,
          hasToken: !!providedToken,
        });
        throw new UnauthorizedException('Invalid webhook token');
      }
    }

    // Log inicial usando Logger do NestJS (sempre aparece)
    this.nestLogger.log(`🔔 [WEBHOOK] Endpoint chamado - Webhook recebido - RequestId: ${requestId}`);

    // Normalizar o payload para o formato esperado (Evolution API pode usar diferentes formatos)
    const webhook: EvolutionWebhookDto = {
      event: body.event || 'unknown',
      instance: body.instance || 'unknown',
      data: body.data || {},
      destination: body.destination,
      date_time: body.date_time || body.dateTime,
      sender: body.sender,
      server_url: body.server_url || body.serverUrl,
      apikey: body.apikey || body.apikey,
    };

    // Extrair messageId do payload para rastreamento
    const messageIdFromPayload = body?.data?.key?.id || body?.data?.id || 'Sem ID';

    // Log inicial para verificar se o endpoint está sendo chamado
    this.logger.info('🔔 Webhook recebido no endpoint', {
      requestId,
      event: webhook.event,
      instance: webhook.instance,
      timestamp: webhook.date_time || new Date().toISOString(),
      sender: webhook.sender,
      server_url: webhook.server_url,
      messageIdFromPayload,
    });

    // Log dos headers recebidos (passa objeto cru — logger redacta chaves sensíveis)
    if (Object.keys(headers).length > 0) {
      this.logger.debug('Headers recebidos no webhook', { headers });
    }

    try {
      // Processar webhook
      await this.whatsappWebhookService.processWebhook(webhook);

      this.nestLogger.log(`[SUCCESS] [WEBHOOK] Webhook processado com sucesso - RequestId: ${requestId}`);
      this.logger.info('[SUCCESS] Webhook processado com sucesso', {
        requestId,
        event: webhook.event,
        instance: webhook.instance,
        messageIdFromPayload,
      });

      return {
        success: true,
        message: 'Webhook processado com sucesso',
      };
    } catch (error) {
      this.nestLogger.error(`[ERROR] [WEBHOOK] Erro ao processar webhook - RequestId: ${requestId}`, error instanceof Error ? error.stack : String(error));
      this.logger.error('[ERROR] Erro ao processar webhook', {
        requestId,
        messageIdFromPayload,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        webhook,
      });

      throw error;
    }
  }
}

