import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

export interface AssignConversationInput {
  conversationId: string;
  realtorId: string;
}

@Injectable()
export class AssignConversationUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: AssignConversationInput): Promise<void> {
    const { conversationId, realtorId } = input;

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversa não encontrada: ${conversationId}`);
    }

    const realtor = await this.userRepository.findById(realtorId);
    if (!realtor) {
      throw new NotFoundException(`Corretor não encontrado: ${realtorId}`);
    }

    if (realtor.role !== UserRole.CORRETOR && realtor.role !== UserRole.ADMIN) {
      throw new BadRequestException('O usuário alvo não é um corretor');
    }

    await this.conversationRepository.assignRealtor(conversationId, realtorId);

    this.logger.info('[Conversations] Conversa atribuída ao corretor', {
      conversationId,
      realtorId,
      realtorName: realtor.name,
    });
  }
}
