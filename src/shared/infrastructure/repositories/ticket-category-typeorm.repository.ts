import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketCategory } from '../../domain/entities/ticket-category.entity';
import { ITicketCategoryRepository } from '../../domain/interfaces/ticket-category-repository.interface';

@Injectable()
export class TicketCategoryTypeOrmRepository implements ITicketCategoryRepository {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly repository: Repository<TicketCategory>,
  ) {}

  async save(category: TicketCategory): Promise<TicketCategory> {
    return this.repository.save(category);
  }

  async findById(id: string): Promise<TicketCategory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<TicketCategory[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByEventId(eventId: string): Promise<TicketCategory[]> {
    return this.repository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, category: TicketCategory): Promise<TicketCategory | null> {
    const existingCategory = await this.findById(id);
    if (!existingCategory) {
      return null;
    }

    Object.assign(existingCategory, category);
    return this.repository.save(existingCategory);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}
