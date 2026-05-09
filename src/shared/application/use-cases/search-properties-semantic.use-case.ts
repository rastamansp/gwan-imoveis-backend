import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  IPropertyRepository,
  SemanticSearchFilters,
  SemanticSearchHit,
} from '../../domain/interfaces/property-repository.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { EmbeddingRouterService } from '../../infrastructure/services/embedding/embedding-router.service';
import { EmbeddingResult } from '../../infrastructure/services/embedding/embedding-provider.interface';

export interface SearchPropertiesSemanticInput {
  q: string;
  filters: SemanticSearchFilters;
  limit: number;
  minScore: number;
}

@Injectable()
export class SearchPropertiesSemanticUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    private readonly embeddingRouter: EmbeddingRouterService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: SearchPropertiesSemanticInput): Promise<SemanticSearchHit[]> {
    const provider = this.embeddingService.getProviderName();

    if (!this.embeddingRouter.isActiveProviderConfigured()) {
      throw new ServiceUnavailableException(
        `Provider de embedding "${provider}" sem API key configurada`,
      );
    }

    let queryEmbedding: EmbeddingResult;
    try {
      queryEmbedding = await this.embeddingService.generateEmbeddingDetailed(input.q, 'query');
    } catch (err) {
      this.logger.error('Falha ao gerar embedding da query de busca semântica', {
        provider,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new ServiceUnavailableException(
        `Provider de embedding "${provider}" temporariamente indisponível`,
      );
    }

    this.logger.debug('Busca semântica iniciada', {
      provider,
      q: input.q,
      limit: input.limit,
      minScore: input.minScore,
    });

    const hits = await this.propertyRepository.searchBySimilarity(
      provider,
      queryEmbedding.vector,
      input.filters,
      input.limit,
      input.minScore,
    );

    this.logger.debug('Busca semântica concluída', {
      provider,
      results: hits.length,
    });

    return hits;
  }
}
