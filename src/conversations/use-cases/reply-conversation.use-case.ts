import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { IMessageRepository } from '../../shared/domain/interfaces/message-repository.interface';
import { Message } from '../../shared/domain/entities/message.entity';
import { MessageDirection } from '../../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../../shared/domain/value-objects/message-channel.enum';
import { ConversationStatus } from '../../shared/domain/value-objects/conversation-status.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';
import { EvolutionApiService } from '../../whatsapp-webhook/services/evolution-api.service';
import { normalizeNumberForEvolutionSDK } from '../../shared/infrastructure/utils/whatsapp.utils';

export interface ReplyConversationInput {
  conversationId: string;
  requesterId: string;
  requesterRole: UserRole;
  text: string;
}

@Injectable()
export class ReplyConversationUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  async execute(input: ReplyConversationInput): Promise<Message> {
    const { conversationId, requesterId, requesterRole, text } = input;

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversa não encontrada: ${conversationId}`);
    }

    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new BadRequestException('Não é possível responder uma conversa encerrada');
    }

    if (requesterRole !== UserRole.ADMIN && !conversation.isAssignedTo(requesterId)) {
      throw new ForbiddenException('Acesso negado: esta conversa não está atribuída a você');
    }

    // `normalizeNumberForEvolutionSDK` lança `Error` cru para formato inválido
    // (ex.: phoneNumber gravado como @lid). Sem este catch viraria 500 opaco.
    let recipient: string;
    try {
      recipient = normalizeNumberForEvolutionSDK(conversation.phoneNumber);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn('[Conversations] Número da conversa inválido para envio', {
        conversationId,
        phoneNumber: conversation.phoneNumber,
        reason,
      });
      throw new BadRequestException(`Número do cliente inválido para envio via WhatsApp: ${reason}`);
    }

    // A instância precisa estar com sessão WhatsApp ativa. Se estiver `close`,
    // o Evolution responde 500 no sendText — melhor falhar antes, com causa legível.
    await this.assertInstanceConnected(conversation.instanceName);

    this.logger.info('[Conversations] Enviando resposta manual via WhatsApp', {
      conversationId,
      requesterId,
      recipient,
      textLength: text.length,
    });

    try {
      await this.evolutionApiService.sendTextMessage(conversation.instanceName, recipient, text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error('[Conversations] Falha ao enviar resposta via Evolution', {
        conversationId,
        instanceName: conversation.instanceName,
        recipient,
        reason,
      });
      throw new ServiceUnavailableException(
        `Não foi possível enviar a mensagem pelo WhatsApp (instância "${conversation.instanceName}"). ` +
          'Verifique a conexão do WhatsApp em /profile e tente novamente.',
      );
    }

    const message = Message.create(
      uuidv4(),
      conversationId,
      text,
      MessageDirection.OUTGOING,
      new Date(),
      null,
      conversation.phoneNumber,
      MessageChannel.WHATSAPP,
    );

    const saved = await this.messageRepository.save(message);

    this.logger.info('[Conversations] Resposta enviada e salva', {
      conversationId,
      messageId: saved.id,
    });

    return saved;
  }

  /**
   * Garante que a instância Evolution da conversa tem sessão WhatsApp ativa.
   *
   * A consulta é best-effort: se o Evolution não responder ou devolver uma
   * instância diferente da pedida, seguimos para o envio em vez de bloquear —
   * o try/catch do `sendTextMessage` ainda cobre a falha com 503.
   */
  private async assertInstanceConnected(instanceName: string): Promise<void> {
    let instance: Awaited<ReturnType<typeof this.evolutionApiService.fetchInstanceByName>>;

    try {
      instance = await this.evolutionApiService.fetchInstanceByName(instanceName);
    } catch (error) {
      this.logger.warn('[Conversations] Não foi possível checar o status da instância; seguindo para o envio', {
        instanceName,
        reason: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    if (!instance) {
      throw new ServiceUnavailableException(
        `A instância de WhatsApp "${instanceName}" desta conversa não existe mais no Evolution. ` +
          'Reconecte o WhatsApp em /profile.',
      );
    }

    if (instance.name !== instanceName) {
      this.logger.warn('[Conversations] Consulta de instância devolveu nome divergente; ignorando checagem', {
        requested: instanceName,
        returned: instance.name,
      });
      return;
    }

    if (instance.connectionStatus !== 'open') {
      this.logger.warn('[Conversations] Envio bloqueado: instância sem sessão ativa', {
        instanceName,
        connectionStatus: instance.connectionStatus,
      });
      throw new ServiceUnavailableException(
        `WhatsApp desconectado (instância "${instanceName}", status "${instance.connectionStatus}"). ` +
          'Reconecte lendo o QR Code em /profile e tente novamente.',
      );
    }
  }
}
