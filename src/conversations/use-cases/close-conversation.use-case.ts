import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { ConversationStatus } from '../../shared/domain/value-objects/conversation-status.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

export interface CloseConversationInput {
  conversationId: string;
  requesterId: string;
  requesterRole: UserRole;
}

@Injectable()
export class CloseConversationUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: CloseConversationInput): Promise<void> {
    const { conversationId, requesterId, requesterRole } = input;

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversa não encontrada: ${conversationId}`);
    }

    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new BadRequestException('A conversa já está encerrada');
    }

    if (requesterRole !== UserRole.ADMIN && !conversation.isAssignedTo(requesterId)) {
      throw new ForbiddenException('Acesso negado: esta conversa não está atribuída a você');
    }

    await this.conversationRepository.close(conversationId);

    this.logger.info('[Conversations] Conversa encerrada', {
      conversationId,
      requesterId,
    });
  }
}
