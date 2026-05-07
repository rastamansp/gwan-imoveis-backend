import { Injectable, Inject } from '@nestjs/common';
import {
  IConversationRepository,
  ConversationFilters,
  PaginatedResult,
} from '../../shared/domain/interfaces/conversation-repository.interface';
import { Conversation } from '../../shared/domain/entities/conversation.entity';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

export interface ListConversationsInput {
  requesterId: string;
  requesterRole: UserRole;
  filters: ConversationFilters;
}

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: ListConversationsInput): Promise<PaginatedResult<Conversation>> {
    const { requesterId, requesterRole, filters } = input;

    this.logger.info('[Conversations] Listando conversas', {
      requesterId,
      requesterRole,
      filters,
    });

    if (requesterRole === UserRole.ADMIN) {
      return await this.conversationRepository.findAllPaginated(filters);
    }

    // CORRETOR vê apenas as conversas atribuídas a ele
    return await this.conversationRepository.findAllByRealtorPaginated(requesterId, filters);
  }
}
