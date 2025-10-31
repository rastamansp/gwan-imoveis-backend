import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ArtistSearchFilters } from '../../domain/value-objects/artist-search-filters';

@Injectable()
export class SearchArtistsUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(filters: ArtistSearchFilters): Promise<Artist[]> {
    const startTime = Date.now();
    
    this.logger.info('Buscando artistas por filtros', {
      filters,
      timestamp: new Date().toISOString(),
    });

    try {
      const artists = await this.artistRepository.search(filters);

      const duration = Date.now() - startTime;
      this.logger.info('Busca concluída', {
        count: artists.length,
        filters,
        duration,
      });

      return artists;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar artistas', {
        filters,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

