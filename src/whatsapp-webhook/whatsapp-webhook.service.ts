import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { EvolutionWebhookDto, EvolutionEventType } from './dtos/evolution-webhook.dto';
import { ChatService } from '../chat/chat.service';
import { EvolutionApiService } from './services/evolution-api.service';
import { CreateOrFindConversationUseCase } from '../shared/application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from '../shared/application/use-cases/save-message.use-case';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { IConversationRepository } from '../shared/domain/interfaces/conversation-repository.interface';
import { IQRCodeService } from '../shared/application/interfaces/qrcode.interface';
import { extractPhoneNumberFromRemoteJid, normalizeNumberForEvolutionSDK } from '../shared/infrastructure/utils/whatsapp.utils';
import { MessageDirection } from '../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../shared/domain/value-objects/message-channel.enum';
import { RegistrationService } from './services/registration.service';
import { ResolveConversationAgentUseCase } from '../shared/application/use-cases/resolve-conversation-agent.use-case';
import { GetOrSetUserPreferredAgentUseCase } from '../shared/application/use-cases/get-or-set-user-preferred-agent.use-case';
import { ResponseFormatterService } from '../chat/services/response-formatter.service';

@Injectable()
export class WhatsappWebhookService {
  // TTL para cache de messageIds processados (24 horas em segundos) - aumentado para evitar reprocessamento
  private readonly messageIdCacheTtl = 24 * 60 * 60;
  // Fallback em memória se Redis não estiver disponível (apenas durante execução)
  private readonly inMemoryProcessedIds = new Set<string>();
  // Mensagem padrão quando a IA falha — evita silêncio para o usuário
  private readonly genericErrorReply =
    'Tive um problema momentâneo aqui. Pode reenviar sua pergunta? Se persistir, fale com nosso corretor.';

  constructor(
    @Inject('ILogger') private readonly logger: ILogger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly evolutionApiService: EvolutionApiService,
    private readonly createOrFindConversationUseCase: CreateOrFindConversationUseCase,
    private readonly saveMessageUseCase: SaveMessageUseCase,
    private readonly registrationService: RegistrationService,
    private readonly resolveConversationAgentUseCase: ResolveConversationAgentUseCase,
    private readonly getOrSetUserPreferredAgentUseCase: GetOrSetUserPreferredAgentUseCase,
    private readonly responseFormatter: ResponseFormatterService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IQRCodeService')
    private readonly qrCodeService: IQRCodeService,
  ) {}

  private isWhatsappRegistrationEnabled(): boolean {
    const raw = this.configService.get<string>('FEATURE_WHATSAPP_REGISTRATION');
    return String(raw).toLowerCase() === 'true';
  }

  /**
   * Processa e registra webhook recebido da Evolution API
   */
  async processWebhook(webhook: EvolutionWebhookDto): Promise<void> {
    const timestamp = new Date().toISOString();
    const webhookId = `${webhook.event}-${webhook.instance}-${Date.now()}`;
    
    this.logger.info('[WEBHOOK] Webhook recebido da Evolution API', {
      event: webhook.event,
      instance: webhook.instance,
      timestamp,
      webhookId,
    });

    // Log detalhado baseado no tipo de evento
    switch (webhook.event) {
      case EvolutionEventType.MESSAGES_UPSERT:
        await this.processMessagesUpsert(webhook, webhookId);
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
        // Log completo do payload para análise (logger redacta chaves sensíveis)
        this.logger.debug('Payload completo do webhook', {
          event: webhook.event,
          instance: webhook.instance,
          fullPayload: webhook,
        });
    }
  }

  /**
   * Processa evento de mensagens recebidas/enviadas
   */
  private async processMessagesUpsert(webhook: EvolutionWebhookDto, webhookId: string): Promise<void> {
    this.logger.info('[MESSAGES_UPSERT] Processando mensagens do webhook', {
      webhookId,
      instance: webhook.instance,
      dataType: webhook.data ? typeof webhook.data : 'undefined',
    });

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
          fullData: webhook.data,
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

      // Extrair número do remetente.
      // Prioridade: senderPn (número real) > remoteJid > sender do webhook.
      // remoteJid pode vir como @lid (Linked Device ID) em WhatsApp multi-device — não é número válido.
      const senderPn = (key as any).senderPn || null;
      const rawRemoteJid = key.remoteJid || (webhook.sender as string) || '';
      const remoteJid = (rawRemoteJid.endsWith('@lid') && senderPn) ? senderPn : rawRemoteJid || 'Desconhecido';
      const remoteJidAlt = (key as any).remoteJidAlt || (rawRemoteJid.endsWith('@lid') ? null : null) || null;
      const isFromMe = key.fromMe || false;
      const messageId = key.id || messageData?.id || 'Sem ID';

      // Ignorar mensagens com @lid sem senderPn — não há como responder
      if (rawRemoteJid.endsWith('@lid') && !senderPn) {
        this.logger.warn('[SKIP] Mensagem com LID sem senderPn, ignorando', {
          messageId,
          remoteJid: rawRemoteJid,
          instance: webhook.instance,
          webhookId,
        });
        continue;
      }

      // IGNORAR mensagens enviadas por nós (fromMe: true) - não devem ser processadas
      if (isFromMe) {
        this.logger.debug('[SKIP] Mensagem enviada por nós (fromMe: true), ignorando processamento', {
          messageId,
          instance: webhook.instance,
          remoteJid,
          webhookId,
        });
        continue; // Pular para próxima mensagem
      }

      // Verificar se já processamos esta mensagem para evitar duplicação
      if (messageId !== 'Sem ID') {
        const cacheKey = `processed:messageId:${messageId}`;
        let isProcessed = false;
        
        // Verificar cache Redis primeiro
        try {
          const cached = await this.cacheManager.get<boolean>(cacheKey);
          if (cached) {
            isProcessed = true;
          }
        } catch (error) {
          // Se Redis não estiver disponível, usar fallback em memória
          this.logger.error('[CACHE] Redis não disponível - usando fallback em memória', {
            messageId,
            error: error instanceof Error ? error.message : String(error),
            webhookId,
          });
          
          // Verificar fallback em memória
          if (this.inMemoryProcessedIds.has(messageId)) {
            isProcessed = true;
          }
        }
        
        if (isProcessed) {
          this.logger.warn('[SKIP] Mensagem já processada anteriormente, pulando para evitar duplicação', {
            messageId,
            instance: webhook.instance,
            remoteJid,
            webhookId,
          });
          continue;
        }
        
        this.logger.debug('[CACHE] Mensagem não encontrada no cache, processando', {
          messageId,
          cacheKey,
          webhookId,
        });
      } else {
        this.logger.warn('[WARNING] Mensagem sem ID - não pode ser cacheada, pode causar duplicação', {
          remoteJid,
          instance: webhook.instance,
        });
      }

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
        webhookId,
        rawData: messageData,
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

      // Se a conversa ainda não tem agente definido, deixar o use case resolver o default global (corretor-imoveis)
      if (!conversation.currentAgentId) {
        await this.resolveConversationAgentUseCase.execute({
          conversationId: conversation.id,
          userId,
        });

        // Recarregar conversa para ter currentAgentId atualizado
        conversation = await this.conversationRepository.findById(conversation.id);
        if (!conversation) {
          this.logger.error('[ERROR] Conversa não encontrada após definir agente default', { phoneNumber });
          return;
        }
      }

      // Processar mensagens recebidas
      if (!isFromMe && messageText && messageText !== '[Mensagem sem texto]') {
        const normalizedCommand = messageText.trim().toLowerCase();
        const normalizedRemoteJid = normalizeNumberForEvolutionSDK(remoteJid, remoteJidAlt);

        // Verificar se tem cadastro em andamento (sempre ler do banco atualizado)
        const registrationStatus = this.registrationService.getRegistrationStatus(conversation);

        if (!isUserRegistered) {
          // Feature flag: cadastro via WhatsApp pode estar desativado.
          if (!this.isWhatsappRegistrationEnabled()) {
            this.logger.info('[REGISTRATION] Cadastro via WhatsApp desativado por feature flag', {
              phoneNumber,
              conversationId: conversation.id,
            });
            await this.evolutionApiService.sendTextMessage(
              webhook.instance,
              normalizedRemoteJid,
              'Olá! Para usar nosso atendimento via WhatsApp, primeiro cadastre-se em https://imoveis.gwan.cloud. Depois é só voltar a falar comigo por aqui. 🙂',
            );
            await this.markMessageProcessed(messageId);
            return;
          }

          // Usuário não cadastrado - verificar se precisa iniciar cadastro
          if (!registrationStatus || registrationStatus === 'cancelled') {
            // Iniciar fluxo de cadastro
            await this.registrationService.startRegistration(conversation.id, phoneNumber, webhook.instance, normalizedRemoteJid);
            await this.markMessageProcessed(messageId);
            return; // Não processar mensagem como chat normal
          } else if (registrationStatus !== 'completed') {
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

            await this.markMessageProcessed(messageId);
            return; // Não processar como chat normal durante cadastro
          }
        }

        // Resolver agente atual da conversa (considerando usuário e preferências)
        const resolvedAgent = isUserRegistered && userId
          ? await this.resolveConversationAgentUseCase.execute({
              conversationId: conversation.id,
              userId,
            })
          : await this.resolveConversationAgentUseCase.execute({
              conversationId: conversation.id,
            });

        const currentAgentId = resolvedAgent.agent.id;

        // Salvar mensagem recebida com agente associado
        await this.saveMessageUseCase.execute({
          conversationId: conversation.id,
          content: messageText,
          direction: MessageDirection.INCOMING,
          messageId,
          phoneNumber,
          channel: MessageChannel.WHATSAPP,
          timestamp: messageTimestamp
            ? new Date(typeof messageTimestamp === 'number' ? messageTimestamp * 1000 : new Date(messageTimestamp).getTime())
            : new Date(),
          agentId: currentAgentId,
        });

        // Processar como chat normal (apenas se usuário cadastrado ou cadastro completo)
        if (isUserRegistered || registrationStatus === 'completed') {
          // Normalizar remoteJid antes de processar
          const normalizedRemoteJid = normalizeNumberForEvolutionSDK(remoteJid, remoteJidAlt);
          
          try {
            await this.processIncomingMessage(
              webhook.instance,
              normalizedRemoteJid,
              messageText,
              messageId,
              conversation.id,
              userId,
            );
          } catch (error) {
            // Falha ao processar a mensagem — tentar avisar o usuário e marcar como processada
            // mesmo assim, para evitar loop infinito de retry pelo Evolution.
            this.logger.error('[ERROR] Erro ao processar mensagem', {
              messageId,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            await this.sendErrorReply(webhook.instance, normalizedRemoteJid, messageId);
          }

          // Marcar mensagem como processada — sucesso, falha ou resposta vazia.
          // O objetivo é evitar reprocessamento; a resposta amigável já foi enviada.
          await this.markMessageProcessed(messageId);
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
      updateData: updateData,
    });
  }

  /**
   * Processa deleção de mensagens
   */
  private async processMessagesDelete(webhook: EvolutionWebhookDto): Promise<void> {
    const deleteData = webhook.data || {};

    this.logger.info('[DELETE] Mensagem deletada no WhatsApp', {
      instance: webhook.instance,
      deleteData,
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
      connectionData,
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
      contactData: contactsData,
    });
  }

  /**
   * Processa atualização de grupos
   */
  private async processGroupsUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const groupsData = webhook.data || {};

    this.logger.info('[GROUP] Grupo atualizado', {
      instance: webhook.instance,
      groupData: groupsData,
    });
  }

  /**
   * Processa atualização de presença (online/offline)
   */
  private async processPresenceUpdate(webhook: EvolutionWebhookDto): Promise<void> {
    const presenceData = webhook.data || {};

    this.logger.info('[PRESENCE] Presença atualizada', {
      instance: webhook.instance,
      presenceData,
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
    userId?: string | null,
  ): Promise<void> {
    const startTime = Date.now();
    const processId = `process-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Resolver agente ativo neste momento (garante que usamos sempre o estado mais recente)
    const resolvedAgent = await this.resolveConversationAgentUseCase.execute({
      conversationId,
      userId: userId || undefined,
    });
    const agentSlug = resolvedAgent.agent.slug;
    const agentId = resolvedAgent.agent.id;

    this.logger.info('[PROCESS] Iniciando processamento de mensagem recebida', {
      instanceName,
      remoteJid,
      messageText: messageText.substring(0, 50),
      messageId,
      conversationId,
      processId,
      agentSlug,
      agentId,
    });

    try {
      // Chamar agente correto baseado no slug
      this.logger.info('[CHAT] Chamando agente para mensagem recebida', {
        instanceName,
        remoteJid,
        messageText,
        userId: userId || 'não identificado',
        agentSlug,
      });

      // Passar userId no contexto se disponível
      const userCtx = userId ? { userId } : undefined;

      // Usar serviço de chat padrão (será atualizado para imóveis)
      const chatResponse = await this.chatService.chat(messageText, userCtx, MessageChannel.WHATSAPP, {
        conversationId,
      });

      if (!chatResponse || !chatResponse.answer) {
        this.logger.warn('[WARNING] Chat não retornou resposta válida', {
          instanceName,
          remoteJid,
          messageText,
          chatResponse: chatResponse ? JSON.stringify(chatResponse) : 'null',
        });
        await this.sendErrorReply(instanceName, remoteJid, messageId);
        return;
      }

      const answer = chatResponse.answer;
      const formattedResponse = chatResponse.formattedResponse;

      this.logger.info('[SUCCESS] Resposta do chat obtida', {
        instanceName,
        remoteJid,
        answerLength: answer.length,
        toolsUsed: chatResponse.toolsUsed?.length || 0,
        hasFormattedResponse: !!formattedResponse,
        hasMedia: formattedResponse?.media && formattedResponse.media.length > 0,
      });

      // Obter phoneNumber da conversa para salvar na mensagem de resposta
      const conversationForResponse = await this.conversationRepository.findById(conversationId);
      const phoneNumberForResponse = conversationForResponse?.phoneNumber || null;

      // Usar resposta formatada se disponível, caso contrário usar resposta bruta
      const responseText = formattedResponse?.answer || answer;

      // Salvar mensagem de resposta (outgoing) com canal WHATSAPP
      await this.saveMessageUseCase.execute({
        conversationId,
        content: responseText,
        direction: MessageDirection.OUTGOING,
        messageId: null, // Mensagem enviada pelo sistema não tem messageId do WhatsApp
        phoneNumber: phoneNumberForResponse,
        channel: MessageChannel.WHATSAPP,
        timestamp: new Date(),
        response: answer, // Manter resposta bruta para logs
        toolsUsed: chatResponse.toolsUsed || null,
        agentId: agentId || null,
      });

      // Enviar mensagem formatada (texto + imagem se disponível)
      this.logger.debug('[SEND] Verificando formato de resposta', {
        instanceName,
        remoteJid,
        hasFormattedResponse: !!formattedResponse,
        hasMedia: formattedResponse?.media && formattedResponse.media.length > 0,
        mediaCount: formattedResponse?.media?.length || 0,
        responseType: formattedResponse?.data?.type,
        processId,
      });
      
      if (formattedResponse?.media && formattedResponse.media.length > 0) {
        // Enviar imagens primeiro (sem caption para enviar texto separado depois)
        for (const media of formattedResponse.media) {
          if (media.type === 'image') {
            try {
              // Enviar imagem sem caption (ou com caption mínimo)
              // O texto completo será enviado após a imagem
              await this.evolutionApiService.sendImageMessage(
                instanceName,
                remoteJid,
                media.url,
                media.caption || '', // Usar caption se disponível
              );
              
              // Pequeno delay após enviar imagem
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              this.logger.error('[ERROR] Erro ao enviar imagem', {
                instanceName,
                remoteJid,
                imageUrl: media.url,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
        
        // Enviar texto completo após a imagem
        if (responseText.trim()) {
          await this.evolutionApiService.sendTextMessage(instanceName, remoteJid, responseText);
        }
      } else {
        // Sem mídia, enviar apenas texto
        await this.evolutionApiService.sendTextMessage(instanceName, remoteJid, responseText);
      }

      const duration = Date.now() - startTime;
      this.logger.info('[SUCCESS] Mensagem processada e resposta enviada com sucesso', {
        instanceName,
        remoteJid,
        messageId,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('[ERROR] Erro ao processar mensagem recebida', {
        instanceName,
        remoteJid,
        messageText,
        messageId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      // Propaga para o caller decidir resposta ao usuário e dedup do messageId.
      throw error;
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


  /**
   * Marca um messageId como processado (Redis + fallback em memória).
   * Best-effort: nunca propaga erros — sempre adiciona ao Set em memória.
   */
  private async markMessageProcessed(messageId: string): Promise<void> {
    if (!messageId || messageId === 'Sem ID') {
      return;
    }
    const cacheKey = `processed:messageId:${messageId}`;
    try {
      await this.cacheManager.set(cacheKey, true, this.messageIdCacheTtl);
    } catch (error) {
      this.logger.error('[CACHE] Falha ao salvar messageId no Redis — usando memória', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    this.inMemoryProcessedIds.add(messageId);
  }

  /**
   * Envia mensagem genérica de erro quando a IA falha.
   * Falhas no envio são apenas logadas — não propagam.
   */
  private async sendErrorReply(instanceName: string, remoteJid: string, messageId: string): Promise<void> {
    try {
      await this.evolutionApiService.sendTextMessage(instanceName, remoteJid, this.genericErrorReply);
    } catch (sendError) {
      this.logger.error('[ERROR] Falha ao enviar mensagem de erro amigável', {
        instanceName,
        remoteJid,
        messageId,
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  }
}

