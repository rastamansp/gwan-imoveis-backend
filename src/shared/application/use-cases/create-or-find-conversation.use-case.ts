import { Injectable, Inject } from '@nestjs/common';
import { Conversation } from '../../domain/entities/conversation.entity';
import { IConversationRepository } from '../../domain/interfaces/conversation-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ConversationStatus } from '../../domain/value-objects/conversation-status.enum';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrFindConversationCommand {
  phoneNumber: string;
  instanceName: string;
  userId?: string | null;
}

@Injectable()
export class CreateOrFindConversationUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(command: CreateOrFindConversationCommand): Promise<Conversation> {
    const startTime = Date.now();

    this.logger.debug('Criando ou buscando conversa', {
      phoneNumber: command.phoneNumber,
      instanceName: command.instanceName,
      userId: command.userId,
    });

    try {
      // Buscar conversa ativa por número de telefone
      let conversation = await this.conversationRepository.findActiveByPhoneNumber(command.phoneNumber);

      if (conversation) {
        // Se encontrou conversa ativa, atualizar userId se fornecido e não estiver associado
        if (command.userId && !conversation.userId) {
          conversation.associateUser(command.userId);
          conversation = await this.conversationRepository.save(conversation);
        }

        this.logger.debug('Conversa ativa encontrada', {
          conversationId: conversation.id,
          phoneNumber: command.phoneNumber,
          duration: Date.now() - startTime,
        });

        return conversation;
      }

      // Criar nova conversa
      const conversationId = uuidv4();
      const newConversation = Conversation.create(
        conversationId,
        command.phoneNumber,
        command.instanceName,
        command.userId || null,
        ConversationStatus.ACTIVE,
        new Date(),
        null,
      );

      conversation = await this.conversationRepository.save(newConversation);

      this.logger.info('Nova conversa criada', {
        conversationId: conversation.id,
        phoneNumber: command.phoneNumber,
        instanceName: command.instanceName,
        userId: conversation.userId,
        duration: Date.now() - startTime,
      });

      return conversation;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar ou buscar conversa', {
        phoneNumber: command.phoneNumber,
        instanceName: command.instanceName,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

