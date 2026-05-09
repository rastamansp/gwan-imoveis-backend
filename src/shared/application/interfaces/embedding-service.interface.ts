import { EmbeddingInputType, EmbeddingProviderName, EmbeddingResult } from '../../infrastructure/services/embedding/embedding-provider.interface';

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;

  generateEmbeddingDetailed(text: string, inputType?: EmbeddingInputType): Promise<EmbeddingResult>;

  getEmbeddingDimension(): number;

  getModel(): string;

  getProviderName(): EmbeddingProviderName;
}
