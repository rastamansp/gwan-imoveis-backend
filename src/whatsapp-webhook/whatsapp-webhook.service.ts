import { Injectable, Inject } from '@nestjs/common';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { EvolutionWebhookDto, EvolutionEventType } from './dtos/evolution-webhook.dto';
import { ChatService } from '../chat/chat.service';
import { EvolutionApiService } from './services/evolution-api.service';

@Injectable()
export class WhatsappWebhookService {
  constructor(
    @Inject('ILogger') private readonly logger: ILogger,
    private readonly chatService: ChatService,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  /**
   * Processa e registra webhook recebido da Evolution API
   */
  async processWebhook(webhook: EvolutionWebhookDto): Promise<void> {
    const timestamp = new Date().toISOString();
    
    this.logger.info('[WEBHOOK] Webhook recebido da Evolution API', {
      event: webhook.event,
      instance: webhook.instance,
      timestamp,
    });

    // Log detalhado baseado no tipo de evento
    switch (webhook.event) {
      case EvolutionEventType.MESSAGES_UPSERT:
        await this.processMessagesUpsert(webhook);
        break;

      case EvolutionEventType.MESSAGES_UPDATE:
        await this.processMessagesUpdate(webhook);
        break;

      case EvolutionEventType.MESSAGES_DELETE:
        await this.processMessagesDelete(webhook);
        break;

      case EvolutionEventType.CONNECTION_UPDATE:
        await this.processConnectionUpdate(webhook);
        break;

      case EvolutionEventType.QRCODE_UPDATE:
        await this.processQrcodeUpdate(webhook);
        break;

      case EvolutionEventType.CONTACTS_UPDATE:
      case EvolutionEventType.CONTACTS_UPSERT:
        await this.processContactsUpdate(webhook);
        break;

      case EvolutionEventType.GROUPS_UPSERT:
      case EvolutionEventType.GROUPS_UPDATE:
        await this.processGroupsUpdate(webhook);
        break;

      case EvolutionEventType.PRESENCE_UPDATE:
        await this.processPresenceUpdate(webhook);
        break;

      default:
        this.logger.warn('[WARNING] Tipo de evento desconhecido', {
          event: webhook.event,
          instance: webhook.instance,
          data: webhook.data,
        });
        // Log completo do payload para análise
        this.logger.debug('Payload completo do webhook', {
          event: webhook.event,
          instance: webhook.instance,
          fullPayload: JSON.stringify(webhook, null, 2),
        });
    }
  }

  /**
   * Processa evento de mensagens recebidas/enviadas
   */
  private async processMessagesUpsert(webhook: EvolutionWebhookDto): Promise<void> {
    // Evolution API pode enviar diferentes estruturas de data
    // Pode ser um array de mensagens, uma única mensagem, ou apenas metadados
    let messages: any[] = [];
    
    if (Array.isArray(webhook.data)) {
      messages = webhook.data;
    } else if (webhook.data && typeof webhook.data === 'object') {
      // Se data contém informações diretas da mensagem
      if (webhook.data.key || webhook.data.message) {
        messages = [webhook.data];
      } else {
        // Se data contém apenas metadados (instanceId, source, etc)
        // A mensagem real pode estar em outro lugar ou ainda não chegou
        this.logger.warn('[WARNING] Evento messages.upsert recebido mas data não contém mensagem completa', {
          event: webhook.event,
          instance: webhook.instance,
          dataKeys: Object.keys(webhook.data || {}),
          sender: webhook.sender,
          fullData: JSON.stringify(webhook.data, null, 2),
        });
        messages = [webhook.data]; // Processar mesmo assim para logar
      }
    } else {
      messages = [];
    }

    for (const messageData of messages) {
      const key = messageData?.key || {};
      const message = messageData?.message || {};
      const messageTimestamp = messageData?.messageTimestamp || messageData?.timestamp || Date.now();
      const pushName = messageData?.pushName || messageData?.pushName || 'Desconhecido';

      // Extrair texto da mensagem
      let messageText = '';
      if (message.conversation) {
        messageText = message.conversation;
      } else if (message.extendedTextMessage?.text) {
        messageText = message.extendedTextMessage.text;
      } else if (message.imageMessage?.caption) {
        messageText = `[Imagem] ${message.imageMessage.caption}`;
      } else if (message.videoMessage?.caption) {
        messageText = `[Vídeo] ${message.videoMessage.caption}`;
      } else if (message.audioMessage) {
        messageText = '[Áudio]';
      } else if (message.documentMessage) {
        messageText = `[Documento] ${message.documentMessage.fileName || ''}`;
      } else {
        messageText = '[Mensagem sem texto]';
      }

      // Extrair número do remetente (pode vir de key.remoteJid ou do sender do webhook)
      const remoteJid = key.remoteJid || (webhook.sender as string) || 'Desconhecido';
      const isFromMe = key.fromMe || false;
      const messageId = key.id || messageData?.id || 'Sem ID';

      // Log detalhado da mensagem
      this.logger.info('[MENSAGEM] Mensagem recebida/enviada via WhatsApp', {
        instance: webhook.instance,
        messageId,
        from: remoteJid,
        pushName,
        isFromMe,
        messageType: this.getMessageType(message),
        text: messageText,
        timestamp: messageTimestamp ? new Date(typeof messageTimestamp === 'number' ? messageTimestamp * 1000 : new Date(messageTimestamp).getTime()).toISOString() : new Date().toISOString(),
        date_time: webhook.date_time,
        sender: webhook.sender,
        server_url: webhook.server_url,
        rawData: JSON.stringify(messageData, null, 2),
      });

      // Processar apenas mensagens RECEBIDAS (fromMe: false) e que tenham texto válido
      if (!isFromMe && messageText && messageText !== '[Mensagem sem texto]') {
        await this.processIncomingMessage(webhook.instance, remoteJid, messageText, messageId);
      }

      // Se não há mensagem completa mas temos sender, logar como evento de mensagem
      if (!messageText || messageText === '[Mensagem sem texto]') {
        if (webhook.sender) {
          this.logger.info('[MENSAGEM] Evento de mensagem recebido (dados parciais)', {
            instance: webhook.instance,
            sender: webhook.sender,
            instanceId: messageData?.instanceId,
            source: messageData?.source,
            eventType: 'messages.upsert',
            date_time: webhook.date_time,
          });
        }
      }
    }
  }

  /**
   * Processa atualização de mensagens (status de leitura, etc)
   */
  private async processMessagesUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const updateData = webhook.data || {};

    this.logger.info('[UPDATE] Mensagem atualizada no WhatsApp', {
      instance: webhook.instance,
      updateData: JSON.stringify(updateData, null, 2),
    });
  }

  /**
   * Processa deleção de mensagens
   */
  private async processMessagesDelete(webhook: EvolutionWebhookDto): Promise<void> {
    const deleteData = webhook.data || {};

    this.logger.info('[DELETE] Mensagem deletada no WhatsApp', {
      instance: webhook.instance,
      deleteData: JSON.stringify(deleteData, null, 2),
    });
  }

  /**
   * Processa atualização de conexão
   */
  private async processConnectionUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const connectionData = webhook.data || {};

    this.logger.info('[CONNECTION] Status de conexão atualizado', {
      instance: webhook.instance,
      connectionState: connectionData.state || 'Desconhecido',
      connectionData: JSON.stringify(connectionData, null, 2),
    });
  }

  /**
   * Processa atualização de QR Code
   */
  private async processQrcodeUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const qrcodeData = webhook.data || {};

    this.logger.info('[QRCODE] QR Code atualizado', {
      instance: webhook.instance,
      qrcode: qrcodeData.qrcode || 'Não disponível',
      status: qrcodeData.status || 'Desconhecido',
    });
  }

  /**
   * Processa atualização de contatos
   */
  private async processContactsUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const contactsData = webhook.data || {};

    this.logger.info('[CONTACT] Contato atualizado', {
      instance: webhook.instance,
      contactData: JSON.stringify(contactsData, null, 2),
    });
  }

  /**
   * Processa atualização de grupos
   */
  private async processGroupsUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const groupsData = webhook.data || {};

    this.logger.info('[GROUP] Grupo atualizado', {
      instance: webhook.instance,
      groupData: JSON.stringify(groupsData, null, 2),
    });
  }

  /**
   * Processa atualização de presença (online/offline)
   */
  private async processPresenceUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const presenceData = webhook.data || {};

    this.logger.info('[PRESENCE] Presença atualizada', {
      instance: webhook.instance,
      presenceData: JSON.stringify(presenceData, null, 2),
    });
  }

  /**
   * Processa mensagem recebida: chama chat e envia resposta via Evolution API
   */
  private async processIncomingMessage(
    instanceName: string,
    remoteJid: string,
    messageText: string,
    messageId: string,
  ): Promise<void> {
    const startTime = Date.now();

    this.logger.info('[PROCESS] Iniciando processamento de mensagem recebida', {
      instanceName,
      remoteJid,
      messageText,
      messageId,
    });

    try {
      // Chamar serviço de chat internamente
      this.logger.info('[CHAT] Chamando serviço de chat', {
        instanceName,
        remoteJid,
        messageText,
      });

      const chatResponse = await this.chatService.chat(messageText);

      if (!chatResponse || !chatResponse.answer) {
        this.logger.warn('[WARNING] Chat não retornou resposta válida', {
          instanceName,
          remoteJid,
          messageText,
          chatResponse: chatResponse ? JSON.stringify(chatResponse) : 'null',
        });
        return;
      }

      const answer = chatResponse.answer;

      this.logger.info('[SUCCESS] Resposta do chat obtida', {
        instanceName,
        remoteJid,
        answerLength: answer.length,
        toolsUsed: chatResponse.toolsUsed?.length || 0,
      });

      // Enviar resposta via Evolution API
      await this.evolutionApiService.sendTextMessage(instanceName, remoteJid, answer);

      const duration = Date.now() - startTime;
      this.logger.info('[SUCCESS] Mensagem processada e resposta enviada com sucesso', {
        instanceName,
        remoteJid,
        messageId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      // Logar erro mas não propagar para não quebrar processamento do webhook
      this.logger.error('[ERROR] Erro ao processar mensagem recebida', {
        instanceName,
        remoteJid,
        messageText,
        messageId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });
    }
  }

  /**
   * Identifica o tipo de mensagem
   */
  private getMessageType(message: any): string {
    if (message.conversation) return 'text';
    if (message.extendedTextMessage) return 'extendedText';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    if (message.locationMessage) return 'location';
    if (message.contactMessage) return 'contact';
    return 'unknown';
  }
}

