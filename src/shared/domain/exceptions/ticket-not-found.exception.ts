import { DomainException } from './domain.exception';

export class TicketNotFoundException extends DomainException {
  constructor(ticketId: string) {
    super(`Ticket with ID ${ticketId} not found`, 'TICKET_NOT_FOUND');
  }
}
