import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userName: string;
  userEmail: string;
  price: number;
  qrCode: string;
  qrCodeData: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'TRANSFERRED';
  purchaseDate: Date;
  usedDate?: Date;
  transferDate?: Date;
  transferredTo?: string;
}

@Injectable()
export class TicketsService {
  private tickets: Ticket[] = [
    {
      id: '1',
      eventId: '1',
      eventTitle: 'Festival de Música Eletrônica',
      eventDate: new Date('2024-06-15T20:00:00Z'),
      eventLocation: 'Parque da Cidade',
      categoryId: '1',
      categoryName: 'Pista',
      userId: '2',
      userName: 'João Silva',
      userEmail: 'joao@email.com',
      price: 150.00,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      qrCodeData: 'TICKET_1_2024-06-15_20:00',
      status: 'ACTIVE',
      purchaseDate: new Date(),
    },
  ];

  async create(ticketData: Partial<Ticket>): Promise<Ticket> {
    const qrCodeData = `TICKET_${uuidv4()}_${ticketData.eventDate}_${ticketData.userId}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    const ticket: Ticket = {
      id: uuidv4(),
      eventId: ticketData.eventId,
      eventTitle: ticketData.eventTitle,
      eventDate: ticketData.eventDate,
      eventLocation: ticketData.eventLocation,
      categoryId: ticketData.categoryId,
      categoryName: ticketData.categoryName,
      userId: ticketData.userId,
      userName: ticketData.userName,
      userEmail: ticketData.userEmail,
      price: ticketData.price,
      qrCode: qrCodeImage,
      qrCodeData: qrCodeData,
      status: 'ACTIVE',
      purchaseDate: new Date(),
    };

    this.tickets.push(ticket);
    return ticket;
  }

  async findAll(): Promise<Ticket[]> {
    return this.tickets;
  }

  async findById(id: string): Promise<Ticket | undefined> {
    return this.tickets.find(ticket => ticket.id === id);
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return this.tickets.filter(ticket => ticket.userId === userId);
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return this.tickets.filter(ticket => ticket.eventId === eventId);
  }

  async validateTicket(qrCodeData: string): Promise<{ valid: boolean; ticket?: Ticket; message: string }> {
    const ticket = this.tickets.find(t => t.qrCodeData === qrCodeData);
    
    if (!ticket) {
      return { valid: false, message: 'Ingresso não encontrado' };
    }

    if (ticket.status === 'USED') {
      return { valid: false, ticket, message: 'Ingresso já foi utilizado' };
    }

    if (ticket.status === 'CANCELLED') {
      return { valid: false, ticket, message: 'Ingresso cancelado' };
    }

    if (new Date() < ticket.eventDate) {
      return { valid: false, ticket, message: 'Evento ainda não começou' };
    }

    return { valid: true, ticket, message: 'Ingresso válido' };
  }

  async useTicket(id: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket || ticket.status !== 'ACTIVE') {
      return undefined;
    }

    ticket.status = 'USED';
    ticket.usedDate = new Date();
    return ticket;
  }

  async transferTicket(id: string, newUserId: string, newUserName: string, newUserEmail: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket || ticket.status !== 'ACTIVE') {
      return undefined;
    }

    ticket.status = 'TRANSFERRED';
    ticket.transferDate = new Date();
    ticket.transferredTo = newUserId;
    ticket.userId = newUserId;
    ticket.userName = newUserName;
    ticket.userEmail = newUserEmail;

    return ticket;
  }

  async cancelTicket(id: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket || ticket.status !== 'ACTIVE') {
      return undefined;
    }

    ticket.status = 'CANCELLED';
    return ticket;
  }

  async getTicketStats(eventId?: string): Promise<{ total: number; active: number; used: number; cancelled: number }> {
    let filteredTickets = this.tickets;
    if (eventId) {
      filteredTickets = this.tickets.filter(ticket => ticket.eventId === eventId);
    }

    return {
      total: filteredTickets.length,
      active: filteredTickets.filter(t => t.status === 'ACTIVE').length,
      used: filteredTickets.filter(t => t.status === 'USED').length,
      cancelled: filteredTickets.filter(t => t.status === 'CANCELLED').length,
    };
  }
}
