import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';

@Injectable()
export class EventTypeOrmRepository implements IEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async save(event: Event): Promise<Event> {
    return await this.eventRepository.save(event);
  }

  async findById(id: string): Promise<Event | null> {
    return await this.eventRepository.findOne({ where: { id } });
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { organizerId },
      order: { createdAt: 'DESC' }
    });
  }

  async findAll(): Promise<Event[]> {
    return await this.eventRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByCategory(category: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { category },
      order: { createdAt: 'DESC' }
    });
  }

  async findByCity(city: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { city },
      order: { createdAt: 'DESC' }
    });
  }

  async findByCode(code: string): Promise<Event | null> {
    return await this.eventRepository.findOne({ where: { code } });
  }

  async searchByNameOrCode(query: string): Promise<Event[]> {
    const normalizedQuery = query.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
    const qb = this.eventRepository.createQueryBuilder('e');
    qb.where('e.title ILIKE :q', { q: `%${normalizedQuery}%` })
      .orWhere('e.code ILIKE :q', { q: `%${normalizedQuery}%` })
      .orderBy('e.createdAt', 'DESC');
    return await qb.getMany();
  }

  async update(id: string, updatedEvent: Event): Promise<Event | null> {
    const result = await this.eventRepository.update(id, updatedEvent);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.eventRepository.delete(id);
    return result.affected > 0;
  }
}
