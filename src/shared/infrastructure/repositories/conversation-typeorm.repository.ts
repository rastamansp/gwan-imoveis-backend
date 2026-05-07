import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Conversation } from '../../domain/entities/conversation.entity';
import {
  ConversationFilters,
  IConversationRepository,
  PaginatedResult,
} from '../../domain/interfaces/conversation-repository.interface';
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
        endedAt: IsNull(),
      },
      relations: ['user'],
      order: { startedAt: 'DESC' },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { phoneNumber },
      relations: ['user'],
      order: { startedAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: { userId },
      relations: ['user'],
      order: { startedAt: 'DESC' },
    });
  }

  async update(id: string, conversation: Conversation): Promise<Conversation | null> {
    const result = await this.conversationRepository.update(id, conversation);
    if (result.affected === 0) return null;
    return await this.findById(id);
  }

  async findAllPaginated(filters: ConversationFilters): Promise<PaginatedResult<Conversation>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.conversationRepository.findAndCount({
      where,
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAllByRealtorPaginated(
    realtorId: string,
    filters: ConversationFilters,
  ): Promise<PaginatedResult<Conversation>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { assignedRealtorId: realtorId };
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.conversationRepository.findAndCount({
      where,
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async assignRealtor(conversationId: string, realtorId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      assignedRealtorId: realtorId,
    } as any);
  }

  async close(conversationId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      status: ConversationStatus.ENDED,
      endedAt: new Date(),
    } as any);
  }
}
