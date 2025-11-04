import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../domain/interfaces/message-repository.interface';

@Injectable()
export class MessageTypeOrmRepository implements IMessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async save(message: Message): Promise<Message> {
    return await this.messageRepository.save(message);
  }

  async findById(id: string): Promise<Message | null> {
    return await this.messageRepository.findOne({
      where: { id },
      relations: ['conversation'],
    });
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return await this.messageRepository.find({
      where: { conversationId },
      order: {
        timestamp: 'ASC',
      },
    });
  }

  async findByMessageId(messageId: string): Promise<Message | null> {
    return await this.messageRepository.findOne({
      where: { messageId },
      relations: ['conversation'],
    });
  }
}

