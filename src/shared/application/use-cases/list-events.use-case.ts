import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class ListEventsUseCase {
  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(category?: string, city?: string): Promise<Event[]> {
    const startTime = Date.now();
    
    this.logger.info('Listando eventos', {
      category,
      city,
      timestamp: new Date().toISOString(),
    });

    try {
      let events: Event[];

      if (category) {
        events = await this.eventRepository.findByCategory(category);
      } else if (city) {
        events = await this.eventRepository.findByCity(city);
      } else {
        events = await this.eventRepository.findAll();
      }

      const duration = Date.now() - startTime;
      this.logger.info('Eventos listados com sucesso', {
        count: events.length,
        category,
        city,
        duration,
      });

      return events;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao listar eventos', {
        category,
        city,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
