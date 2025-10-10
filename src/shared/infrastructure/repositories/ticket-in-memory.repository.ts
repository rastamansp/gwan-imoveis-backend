import { Injectable } from '@nestjs/common';
import { Ticket } from '../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { TicketStatus } from '../../domain/value-objects/ticket-status.enum';

@Injectable()
export class TicketInMemoryRepository implements ITicketRepository {
  private tickets: Ticket[] = [
    new Ticket(
      '1',
      '1',
      'Festival de Música Eletrônica',
      new Date('2024-06-15T20:00:00Z'),
      'Parque da Cidade',
      '1',
      'Pista',
      '2',
      'João Silva',
      'joao@email.com',
      150.00,
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'TICKET_1_2024-06-15_20:00',
      TicketStatus.ACTIVE,
      new Date(),
    ),
  ];

  async save(ticket: Ticket): Promise<Ticket> {
    this.tickets.push(ticket);
    return ticket;
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.tickets.find(ticket => ticket.id === id) || null;
  }

  async findAll(): Promise<Ticket[]> {
    return [...this.tickets];
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.tickets.filter(ticket => ticket.userId === userId);
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return this.tickets.filter(ticket => ticket.eventId === eventId);
  }

  async findByQrCodeData(qrCodeData: string): Promise<Ticket | null> {
    return this.tickets.find(ticket => ticket.qrCodeData === qrCodeData) || null;
  }

  async update(id: string, updatedTicket: Ticket): Promise<Ticket | null> {
    const index = this.tickets.findIndex(ticket => ticket.id === id);
    if (index === -1) return null;

    this.tickets[index] = updatedTicket;
    return updatedTicket;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.tickets.findIndex(ticket => ticket.id === id);
    if (index === -1) return false;

    this.tickets.splice(index, 1);
    return true;
  }
}
