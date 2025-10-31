import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class ListArtistsUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(): Promise<Artist[]> {
    const startTime = Date.now();
    
    this.logger.info('Listando todos os artistas', {
      timestamp: new Date().toISOString(),
    });

    try {
      const artists = await this.artistRepository.findAll();

      const duration = Date.now() - startTime;
      this.logger.info('Artistas listados com sucesso', {
        count: artists.length,
        duration,
      });

      return artists;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao listar artistas', {
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

