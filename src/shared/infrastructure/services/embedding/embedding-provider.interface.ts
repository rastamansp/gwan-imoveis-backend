export type EmbeddingProviderName = 'voyage' | 'openai';

export type EmbeddingInputType = 'document' | 'query';

export interface EmbeddingResult {
  vector: number[];
  provider: EmbeddingProviderName;
  model: string;
  dimension: number;
}

export interface IEmbeddingProvider {
  generate(text: string, opts?: { inputType?: EmbeddingInputType }): Promise<EmbeddingResult>;
  getProviderName(): EmbeddingProviderName;
  getModel(): string;
  getDimension(): number;
  isConfigured(): boolean;
}
