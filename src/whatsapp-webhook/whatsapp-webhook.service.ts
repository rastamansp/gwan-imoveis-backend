import { Injectable, Inject } from '@nestjs/common';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { EvolutionWebhookDto, EvolutionEventType } from './dtos/evolution-webhook.dto';
import { ChatService } from '../chat/chat.service';
import { EvolutionApiService } from './services/evolution-api.service';
import { CreateOrFindConversationUseCase } from '../shared/application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from '../shared/application/use-cases/save-message.use-case';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { IConversationRepository } from '../shared/domain/interfaces/conversation-repository.interface';
import { extractPhoneNumberFromRemoteJid, normalizeNumberForEvolutionSDK } from '../shared/infrastructure/utils/whatsapp.utils';
import { MessageDirection } from '../shared/domain/value-objects/message-direction.enum';
import { RegistrationService } from './services/registration.service';

@Injectable()
export class WhatsappWebhookService {
  constructor(
    @Inject('ILogger') private readonly logger: ILogger,
    private readonly chatService: ChatService,
    private readonly evolutionApiService: EvolutionApiService,
    private readonly createOrFindConversationUseCase: CreateOrFindConversationUseCase,
    private readonly saveMessageUseCase: SaveMessageUseCase,
    private readonly registrationService: RegistrationService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
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
      // O webhook pode ter remoteJidAlt que é o formato correto quando remoteJid é inválido
      const remoteJid = key.remoteJid || (webhook.sender as string) || 'Desconhecido';
      const remoteJidAlt = (key as any).remoteJidAlt || null;
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

      // Extrair número de telefone do remoteJid
      const phoneNumber = extractPhoneNumberFromRemoteJid(remoteJid);

      // Verificar se usuário está cadastrado
      const isUserRegistered = phoneNumber ? await this.registrationService.checkUserRegistration(phoneNumber) : false;

      // Buscar usuário por número de WhatsApp se disponível
      let userId: string | null = null;
      if (phoneNumber && isUserRegistered) {
        const user = await this.userRepository.findByWhatsappNumber(phoneNumber);
        if (user) {
          userId = user.id;
        }
      }

      // Criar ou buscar conversa
      let conversation = await this.createOrFindConversationUseCase.execute({
        phoneNumber,
        instanceName: webhook.instance,
        userId,
      });

      // Recarregar conversa do banco para garantir que temos o metadata atualizado
      conversation = await this.conversationRepository.findById(conversation.id);
      if (!conversation) {
        this.logger.error('[ERROR] Conversa não encontrada após criação', { phoneNumber });
        return;
      }

      // Processar mensagens recebidas
      if (!isFromMe && messageText && messageText !== '[Mensagem sem texto]') {
        // Verificar se tem cadastro em andamento (sempre ler do banco atualizado)
        const registrationStatus = this.registrationService.getRegistrationStatus(conversation);

        if (!isUserRegistered) {
          // Usuário não cadastrado - verificar se precisa iniciar cadastro
          if (!registrationStatus || registrationStatus === 'cancelled') {
            // Normalizar remoteJid antes de passar para o serviço de registro
            const normalizedRemoteJid = normalizeNumberForEvolutionSDK(remoteJid, remoteJidAlt);
            // Iniciar fluxo de cadastro
            await this.registrationService.startRegistration(conversation.id, phoneNumber, webhook.instance, normalizedRemoteJid);
            return; // Não processar mensagem como chat normal
          } else if (registrationStatus !== 'completed') {
            // Normalizar remoteJid antes de passar para o serviço de registro
            const normalizedRemoteJid = normalizeNumberForEvolutionSDK(remoteJid, remoteJidAlt);
            // Cadastro em andamento - processar resposta
            const result = await this.registrationService.processRegistrationMessage(
              conversation.id,
              phoneNumber,
              webhook.instance,
              messageText,
              normalizedRemoteJid,
            );

            // Se cadastro completado, a próxima mensagem será processada como chat normal
            if (result.completed) {
              // Atualizar conversa para ter userId
              const updatedConversation = await this.conversationRepository.findById(conversation.id);
              if (updatedConversation) {
                conversation.userId = updatedConversation.userId;
              }
            }

            return; // Não processar como chat normal durante cadastro
          }
        }

        // Salvar mensagem recebida
        await this.saveMessageUseCase.execute({
          conversationId: conversation.id,
          content: messageText,
          direction: MessageDirection.INCOMING,
          messageId,
          phoneNumber,
          timestamp: messageTimestamp
            ? new Date(typeof messageTimestamp === 'number' ? messageTimestamp * 1000 : new Date(messageTimestamp).getTime())
            : new Date(),
        });

        // Processar como chat normal (apenas se usuário cadastrado ou cadastro completo)
        if (isUserRegistered || registrationStatus === 'completed') {
          // Normalizar remoteJid antes de processar
          const normalizedRemoteJid = normalizeNumberForEvolutionSDK(remoteJid, remoteJidAlt);
          await this.processIncomingMessage(webhook.instance, normalizedRemoteJid, messageText, messageId, conversation.id);
        }
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
    conversationId: string,
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

      // Obter phoneNumber da conversa para salvar na mensagem de resposta
      const conversationForResponse = await this.conversationRepository.findById(conversationId);
      const phoneNumberForResponse = conversationForResponse?.phoneNumber || null;

      // Salvar mensagem de resposta (outgoing)
      await this.saveMessageUseCase.execute({
        conversationId,
        content: answer,
        direction: MessageDirection.OUTGOING,
        messageId: null, // Mensagem enviada pelo sistema não tem messageId do WhatsApp
        phoneNumber: phoneNumberForResponse,
        timestamp: new Date(),
        response: answer,
        toolsUsed: chatResponse.toolsUsed || null,
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

