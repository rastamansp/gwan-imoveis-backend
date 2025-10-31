import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';

@Injectable()
export class GetArtistsByEventUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(eventId: string): Promise<Artist[]> {
    const startTime = Date.now();
    
    this.logger.info('Buscando artistas do evento', {
      eventId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o evento existe
      const event = await this.eventRepository.findById(eventId);
      if (!event) {
        throw new EventNotFoundException(eventId);
      }

      const artists = await this.artistRepository.findByEventId(eventId);

      const duration = Date.now() - startTime;
      this.logger.info('Artistas do evento listados com sucesso', {
        eventId,
        count: artists.length,
        duration,
      });

      return artists;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar artistas do evento', {
        eventId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

