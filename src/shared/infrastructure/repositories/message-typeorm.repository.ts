import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../domain/entities/message.entity';
import { IMessageRepository } from '../../domain/interfaces/message-repository.interface';
import { PaginatedResult } from '../../domain/interfaces/conversation-repository.interface';

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
      order: { timestamp: 'ASC' },
    });
  }

  async findByConversationIdPaginated(
    conversationId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Message>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.messageRepository.findAndCount({
      where: { conversationId },
      order: { timestamp: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findByMessageId(messageId: string): Promise<Message | null> {
    return await this.messageRepository.findOne({
      where: { messageId },
      relations: ['conversation'],
    });
  }
}
