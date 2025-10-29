export interface IEmbeddingService {
  /**
   * Gera um embedding vetorial para um texto usando OpenAI
   * @param text Texto para gerar embedding
   * @returns Array de números representando o embedding vetorial
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Retorna a dimensão dos embeddings gerados
   * @returns Dimensão do vetor de embedding
   */
  getEmbeddingDimension(): number;

  /**
   * Retorna o modelo usado para gerar embeddings
   * @returns Nome do modelo (ex: "text-embedding-3-small")
   */
  getModel(): string;
}

