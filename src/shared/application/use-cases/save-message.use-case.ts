import { Injectable, Inject } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../domain/interfaces/message-repository.interface';
import { IConversationRepository } from '../../domain/interfaces/conversation-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { MessageDirection } from '../../domain/value-objects/message-direction.enum';
import { MessageChannel } from '../../domain/value-objects/message-channel.enum';
import { v4 as uuidv4 } from 'uuid';

export interface SaveMessageCommand {
  conversationId: string;
  content: string;
  direction: MessageDirection;
  messageId?: string | null;
  phoneNumber?: string | null;
  channel?: MessageChannel | null;
  timestamp?: Date;
  response?: string | null;
  toolsUsed?: any[] | null;
  agentId?: string | null;
}

@Injectable()
export class SaveMessageUseCase {
  constructor(
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(command: SaveMessageCommand): Promise<Message> {
    const startTime = Date.now();

    this.logger.debug('Salvando mensagem', {
      conversationId: command.conversationId,
      direction: command.direction,
      contentLength: command.content.length,
      hasResponse: !!command.response,
      hasToolsUsed: !!command.toolsUsed,
    });

    try {
      // Verificar se a conversa existe
      const conversation = await this.conversationRepository.findById(command.conversationId);
      if (!conversation) {
        throw new Error(`Conversa ${command.conversationId} não encontrada`);
      }

      // Obter phoneNumber da conversa se não fornecido
      let phoneNumber = command.phoneNumber;
      if (!phoneNumber && conversation.phoneNumber) {
        phoneNumber = conversation.phoneNumber;
      }

      // Criar mensagem
      const messageId = uuidv4();
      const message = Message.create(
        messageId,
        command.conversationId,
        command.content,
        command.direction,
        command.timestamp || new Date(),
        command.messageId || null,
        phoneNumber || null,
        command.channel || null,
        command.response || null,
        command.toolsUsed || null,
        command.agentId || null,
      );

      const savedMessage = await this.messageRepository.save(message);

      this.logger.info('Mensagem salva com sucesso', {
        messageId: savedMessage.id,
        conversationId: command.conversationId,
        direction: command.direction,
        duration: Date.now() - startTime,
      });

      return savedMessage;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao salvar mensagem', {
        conversationId: command.conversationId,
        direction: command.direction,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

