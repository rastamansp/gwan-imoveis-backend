import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../domain/entities/conversation.entity';
import { IConversationRepository } from '../../domain/interfaces/conversation-repository.interface';
import { ConversationStatus } from '../../domain/value-objects/conversation-status.enum';

@Injectable()
export class ConversationTypeOrmRepository implements IConversationRepository {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async save(conversation: Conversation): Promise<Conversation> {
    return await this.conversationRepository.save(conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return await this.conversationRepository.findOne({
      where: { id },
      relations: ['user', 'messages'],
    });
  }

  async findActiveByPhoneNumber(phoneNumber: string): Promise<Conversation | null> {
    return await this.conversationRepository.findOne({
      where: {
        phoneNumber,
        status: ConversationStatus.ACTIVE,
        endedAt: null,
      },
      relations: ['user'],
      order: {
        startedAt: 'DESC',
      },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { phoneNumber },
      relations: ['user'],
      order: {
        startedAt: 'DESC',
      },
    });
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId },
      relations: ['user'],
      order: {
        startedAt: 'DESC',
      },
    });
  }

  async update(id: string, conversation: Conversation): Promise<Conversation | null> {
    const result = await this.conversationRepository.update(id, conversation);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }
}

