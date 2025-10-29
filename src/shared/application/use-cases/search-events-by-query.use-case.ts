import { Inject, Injectable } from '@nestjs/common';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { Event } from '../../domain/entities/event.entity';

@Injectable()
export class SearchEventsByQueryUseCase {
  constructor(
    @Inject('IEventRepository') private readonly eventRepository: IEventRepository,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  public async execute(query: string): Promise<Event[]> {
    const start = Date.now();
    this.logger.info('Buscando eventos por nome/código', { query });
    const events = await this.eventRepository.searchByNameOrCode(query);
    this.logger.info('Busca concluída', { query, count: events.length, duration: Date.now() - start });
    return events;
  }
}


