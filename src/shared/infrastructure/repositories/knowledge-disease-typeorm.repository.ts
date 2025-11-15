import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeDisease } from '../../domain/entities/knowledge-disease.entity';
import { IKnowledgeDiseaseRepository } from '../../domain/interfaces/knowledge-disease-repository.interface';

@Injectable()
export class KnowledgeDiseaseTypeOrmRepository implements IKnowledgeDiseaseRepository {
  constructor(
    @InjectRepository(KnowledgeDisease, 'knowledge')
    private readonly knowledgeDiseaseRepository: Repository<KnowledgeDisease>,
  ) {}

  async searchByDiseaseName(name: string): Promise<KnowledgeDisease[]> {
    return this.knowledgeDiseaseRepository
      .createQueryBuilder('disease')
      .where('LOWER(disease.diseaseName) LIKE LOWER(:name)', { name: `%${name}%` })
      .getMany();
  }

  async searchByEmbedding(queryEmbedding: number[], limit: number): Promise<KnowledgeDisease[]> {
    // Buscar todas as doenças com embedding
    const diseases = await this.knowledgeDiseaseRepository
      .createQueryBuilder('disease')
      .where('disease.embedding IS NOT NULL')
      .getMany();

    // Calcular similaridade para cada doença
    const diseasesWithSimilarity = diseases
      .map(disease => {
        const embeddingArray = disease.getEmbeddingArray();
        if (!embeddingArray || embeddingArray.length !== queryEmbedding.length) {
          return null;
        }
        const similarity = this.cosineSimilarity(queryEmbedding, embeddingArray);
        return { disease, similarity };
      })
      .filter((item): item is { disease: KnowledgeDisease; similarity: number } => item !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.disease);

    return diseasesWithSimilarity;
  }

  async searchHybrid(query: string, queryEmbedding: number[], limit: number): Promise<KnowledgeDisease[]> {
    // Buscar por nome
    const nameResults = await this.searchByDiseaseName(query);
    
    // Buscar por embedding
    const embeddingResults = await this.searchByEmbedding(queryEmbedding, limit * 2);

    // Combinar resultados, removendo duplicatas
    const combinedResults = new Map<string, { disease: KnowledgeDisease; score: number }>();

    // Adicionar resultados de busca por nome (score maior para correspondências exatas)
    nameResults.forEach(disease => {
      const isExactMatch = disease.diseaseName.toLowerCase() === query.toLowerCase();
      const score = isExactMatch ? 1.0 : 0.8;
      combinedResults.set(disease.id, { disease, score });
    });

    // Adicionar resultados de busca por embedding
    embeddingResults.forEach((disease, index) => {
      const existing = combinedResults.get(disease.id);
      if (existing) {
        // Se já existe, usar o maior score
        existing.score = Math.max(existing.score, 0.7 - (index * 0.01));
      } else {
        // Calcular similaridade para score
        const embeddingArray = disease.getEmbeddingArray();
        if (embeddingArray) {
          const similarity = this.cosineSimilarity(queryEmbedding, embeddingArray);
          combinedResults.set(disease.id, { disease, score: similarity });
        }
      }
    });

    // Ordenar por score e retornar top N
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.disease);
  }

  /**
   * Calcula a similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }
}

