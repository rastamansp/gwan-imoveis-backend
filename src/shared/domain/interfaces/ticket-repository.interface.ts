import { Ticket } from '../entities/ticket.entity';

export interface ITicketRepository {
  save(ticket: Ticket): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findAll(): Promise<Ticket[]>;
  findByUserId(userId: string): Promise<Ticket[]>;
  findByEventId(eventId: string): Promise<Ticket[]>;
  findByQrCodeData(qrCodeData: string): Promise<Ticket | null>;
  update(id: string, ticket: Ticket): Promise<Ticket | null>;
  delete(id: string): Promise<boolean>;
}
