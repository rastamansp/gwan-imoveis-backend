import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class SearchEventsRagUseCase {
  constructor(
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(query: string, limit: number = 10): Promise<Event[]> {
    const startTime = Date.now();

    this.logger.info('Iniciando busca RAG de eventos', {
      query,
      limit,
      timestamp: new Date().toISOString(),
    });

    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // Gerar embedding da query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query.trim());

      // Buscar eventos por similaridade
      const events = await this.eventRepository.searchByEmbedding(queryEmbedding, limit);

      const duration = Date.now() - startTime;
      this.logger.info('Busca RAG concluída', {
        query,
        foundCount: events.length,
        limit,
        duration,
      });

      return events;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar eventos via RAG', {
        query,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

