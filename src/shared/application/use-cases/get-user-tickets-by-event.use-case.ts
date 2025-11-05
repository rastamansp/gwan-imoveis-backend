import { Injectable, Inject } from '@nestjs/common';
import { Ticket } from '../../domain/entities/ticket.entity';
import { Event } from '../../domain/entities/event.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';

@Injectable()
export class GetUserTicketsByEventUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(userId: string, eventId: string): Promise<{ event: Event; tickets: Ticket[] }> {
    const startTime = Date.now();

    this.logger.info('Buscando ingressos do usuário por evento', {
      userId,
      eventId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validar se evento existe
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      // Buscar tickets do usuário para o evento
      const tickets = await this.ticketRepository.findByUserIdAndEventId(userId, eventId);

      const duration = Date.now() - startTime;
      this.logger.info('Ingressos do usuário encontrados com sucesso', {
        userId,
        eventId,
        eventTitle: event.title,
        ticketsCount: tickets.length,
        duration,
      });

      return {
        event,
        tickets,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar ingressos do usuário por evento', {
        userId,
        eventId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

