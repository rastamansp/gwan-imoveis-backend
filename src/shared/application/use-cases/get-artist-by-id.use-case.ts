import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';

@Injectable()
export class GetArtistByIdUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(artistId: string, includeEvents: boolean = false): Promise<Artist> {
    const startTime = Date.now();
    
    this.logger.info('Buscando artista por ID', {
      artistId,
      includeEvents,
      timestamp: new Date().toISOString(),
    });

    try {
      const artist = includeEvents
        ? await this.artistRepository.findByIdWithEvents(artistId)
        : await this.artistRepository.findById(artistId);
      
      if (!artist) {
        throw new ArtistNotFoundException(artistId);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Artista encontrado com sucesso', {
        artistId,
        artisticName: artist.artisticName,
        eventsCount: artist.events?.length || 0,
        duration,
      });

      return artist;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar artista', {
        artistId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

