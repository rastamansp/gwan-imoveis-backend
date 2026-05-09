import { Inject, Injectable } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { IEmbeddingService } from '../interfaces/embedding-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { Property } from '../../domain/entities/property.entity';
import { buildPropertyEmbeddingChunk } from '../services/property-embedding-chunk.builder';

@Injectable()
export class GeneratePropertyEmbeddingUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IEmbeddingService')
    private readonly embeddingService: IEmbeddingService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(property: Property): Promise<void> {
    const chunk = buildPropertyEmbeddingChunk(property);
    try {
      const result = await this.embeddingService.generateEmbeddingDetailed(chunk, 'document');
      await this.propertyRepository.updateEmbedding(property.id, result, chunk);
      this.logger.info('Embedding gerado para imóvel', {
        propertyId: property.id,
        provider: result.provider,
        model: result.model,
        dimension: result.dimension,
      });
    } catch (error) {
      this.logger.warn('Falha ao gerar embedding do imóvel; seguindo sem indexar', {
        propertyId: property.id,
        provider: this.embeddingService.getProviderName(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
