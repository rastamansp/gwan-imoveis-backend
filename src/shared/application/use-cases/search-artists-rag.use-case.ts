import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class SearchArtistsRagUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(query: string, limit: number = 10): Promise<Artist[]> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando busca RAG de artistas', {
      query,
      limit,
      timestamp: new Date().toISOString(),
    });

    try {
      // Gerar embedding da query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Buscar artistas por similaridade
      const artists = await this.artistRepository.searchByEmbedding(queryEmbedding, limit);

      const duration = Date.now() - startTime;
      this.logger.info('Busca RAG de artistas concluída', {
        query,
        limit,
        found: artists.length,
        duration,
      });

      return artists;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao realizar busca RAG de artistas', {
        query,
        limit,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

