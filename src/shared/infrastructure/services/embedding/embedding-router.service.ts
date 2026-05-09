import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmbeddingService } from '../../../application/interfaces/embedding-service.interface';
import {
  EmbeddingInputType,
  EmbeddingProviderName,
  EmbeddingResult,
  IEmbeddingProvider,
} from './embedding-provider.interface';
import { OpenAiEmbeddingProviderService } from './openai-embedding-provider.service';
import { VoyageEmbeddingProviderService } from './voyage-embedding-provider.service';

@Injectable()
export class EmbeddingRouterService implements IEmbeddingService, OnModuleInit {
  private readonly logger = new Logger(EmbeddingRouterService.name);
  private readonly active: IEmbeddingProvider;

  constructor(
    config: ConfigService,
    voyage: VoyageEmbeddingProviderService,
    openai: OpenAiEmbeddingProviderService,
  ) {
    const requested = (config.get<string>('EMBEDDING_PROVIDER') || 'voyage').toLowerCase();
    this.active = requested === 'openai' ? openai : voyage;
  }

  onModuleInit(): void {
    const name = this.active.getProviderName();
    const model = this.active.getModel();
    const dim = this.active.getDimension();
    this.logger.log(`Embedding provider ativo: ${name} (modelo=${model}, dim=${dim})`);

    if (!this.active.isConfigured()) {
      this.logger.error(
        `Provider ${name} ativo mas API key não configurada. Busca semântica retornará 503; create/update seguem sem embedding.`,
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.active.generate(text, { inputType: 'document' });
    return result.vector;
  }

  async generateEmbeddingDetailed(text: string, inputType: EmbeddingInputType = 'document'): Promise<EmbeddingResult> {
    return this.active.generate(text, { inputType });
  }

  getEmbeddingDimension(): number {
    return this.active.getDimension();
  }

  getModel(): string {
    return this.active.getModel();
  }

  getProviderName(): EmbeddingProviderName {
    return this.active.getProviderName();
  }

  isActiveProviderConfigured(): boolean {
    return this.active.isConfigured();
  }
}
