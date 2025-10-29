import { Event } from '../entities/event.entity';

export interface IEventRepository {
  save(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findAll(): Promise<Event[]>;
  findByOrganizer(organizerId: string): Promise<Event[]>;
  findByCategory(category: string): Promise<Event[]>;
  findByCity(city: string): Promise<Event[]>;
  findByCode(code: string): Promise<Event | null>;
  searchByNameOrCode(query: string): Promise<Event[]>;
  update(id: string, event: Event): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
}
