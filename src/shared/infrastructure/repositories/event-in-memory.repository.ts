import { Injectable } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { EventStatus } from '../../domain/value-objects/event-status.enum';

@Injectable()
export class EventInMemoryRepository implements IEventRepository {
  private events: Event[] = [
    new Event(
      '1',
      'Festival de Música Eletrônica',
      'O maior festival de música eletrônica da cidade com os melhores DJs nacionais e internacionais.',
      new Date('2024-06-15T20:00:00Z'),
      'Parque da Cidade',
      'Av. das Flores, 123',
      'São Paulo',
      'SP',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      'Música',
      '2',
      'João Silva',
      EventStatus.ACTIVE,
      5000,
      1200,
      new Date(),
      new Date(),
    ),
    new Event(
      '2',
      'Workshop de Programação',
      'Aprenda as melhores práticas de desenvolvimento web com especialistas da área.',
      new Date('2024-05-20T09:00:00Z'),
      'Centro de Convenções',
      'Rua da Tecnologia, 456',
      'Rio de Janeiro',
      'RJ',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      'Educação',
      '2',
      'João Silva',
      EventStatus.ACTIVE,
      200,
      45,
      new Date(),
      new Date(),
    ),
  ];

  async save(event: Event): Promise<Event> {
    this.events.push(event);
    return event;
  }

  async findById(id: string): Promise<Event | null> {
    return this.events.find(event => event.id === id) || null;
  }

  async findAll(): Promise<Event[]> {
    return [...this.events];
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return this.events.filter(event => event.organizerId === organizerId);
  }

  async findByCategory(category: string): Promise<Event[]> {
    return this.events.filter(event => 
      event.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  async findByCity(city: string): Promise<Event[]> {
    return this.events.filter(event => 
      event.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  async update(id: string, updatedEvent: Event): Promise<Event | null> {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return null;

    this.events[index] = updatedEvent;
    return updatedEvent;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    return true;
  }
}
