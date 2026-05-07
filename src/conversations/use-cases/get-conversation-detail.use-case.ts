import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { IMessageRepository } from '../../shared/domain/interfaces/message-repository.interface';
import { Conversation } from '../../shared/domain/entities/conversation.entity';
import { Message } from '../../shared/domain/entities/message.entity';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

export interface GetConversationDetailInput {
  conversationId: string;
  requesterId: string;
  requesterRole: UserRole;
  messagesPage?: number;
  messagesLimit?: number;
}

export interface GetConversationDetailResult {
  conversation: Conversation;
  messages: Message[];
  messagesTotal: number;
  messagesPage: number;
  messagesLimit: number;
}

@Injectable()
export class GetConversationDetailUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: GetConversationDetailInput): Promise<GetConversationDetailResult> {
    const { conversationId, requesterId, requesterRole, messagesPage = 1, messagesLimit = 50 } = input;

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversa não encontrada: ${conversationId}`);
    }

    // CORRETOR só pode ver conversa atribuída a ele
    if (requesterRole !== UserRole.ADMIN && !conversation.isAssignedTo(requesterId)) {
      throw new ForbiddenException('Acesso negado: esta conversa não está atribuída a você');
    }

    const paginatedMessages = await this.messageRepository.findByConversationIdPaginated(
      conversationId,
      messagesPage,
      messagesLimit,
    );

    this.logger.info('[Conversations] Detalhe da conversa carregado', {
      conversationId,
      requesterId,
      messagesTotal: paginatedMessages.total,
    });

    return {
      conversation,
      messages: paginatedMessages.data,
      messagesTotal: paginatedMessages.total,
      messagesPage: paginatedMessages.page,
      messagesLimit: paginatedMessages.limit,
    };
  }
}
