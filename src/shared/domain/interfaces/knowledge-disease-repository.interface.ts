import { KnowledgeDisease } from '../entities/knowledge-disease.entity';

export interface IKnowledgeDiseaseRepository {
  /**
   * Busca doenças por nome exato ou parcial (case-insensitive)
   */
  searchByDiseaseName(name: string): Promise<KnowledgeDisease[]>;

  /**
   * Busca doenças usando similaridade semântica com embeddings
   * @param queryEmbedding Embedding da query do usuário
   * @param limit Número máximo de resultados
   */
  searchByEmbedding(queryEmbedding: number[], limit: number): Promise<KnowledgeDisease[]>;

  /**
   * Busca híbrida: combina busca por nome e semântica
   * @param query Query de texto do usuário
   * @param queryEmbedding Embedding da query
   * @param limit Número máximo de resultados
   */
  searchHybrid(query: string, queryEmbedding: number[], limit: number): Promise<KnowledgeDisease[]>;
}

