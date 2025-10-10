import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';

@Injectable()
export class GetEventByIdUseCase {
  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(eventId: string): Promise<Event> {
    const startTime = Date.now();
    
    this.logger.info('Buscando evento por ID', {
      eventId,
      timestamp: new Date().toISOString(),
    });

    try {
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Evento encontrado com sucesso', {
        eventId,
        title: event.title,
        duration,
      });

      return event;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar evento', {
        eventId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
