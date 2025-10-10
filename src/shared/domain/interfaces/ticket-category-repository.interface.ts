import { TicketCategory } from '../entities/ticket-category.entity';

export interface ITicketCategoryRepository {
  save(category: TicketCategory): Promise<TicketCategory>;
  findById(id: string): Promise<TicketCategory | null>;
  findAll(): Promise<TicketCategory[]>;
  findByEventId(eventId: string): Promise<TicketCategory[]>;
  update(id: string, category: TicketCategory): Promise<TicketCategory | null>;
  delete(id: string): Promise<boolean>;
}
