import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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

    const recipient = normalizeNumberForEvolutionSDK(conversation.phoneNumber);

    this.logger.info('[Conversations] Enviando resposta manual via WhatsApp', {
      conversationId,
      requesterId,
      recipient,
      textLength: text.length,
    });

    await this.evolutionApiService.sendTextMessage(conversation.instanceName, recipient, text);

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
}
