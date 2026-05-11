import { Property } from '../entities/property.entity';
import { EmbeddingProviderName, EmbeddingResult } from '../../infrastructure/services/embedding/embedding-provider.interface';

export interface SemanticSearchFilters {
  city?: string;
  type?: string;
  purpose?: string;
  minPrice?: number;
  maxPrice?: number;
  realtorId?: string;
  hasPool?: boolean;
  hasJacuzzi?: boolean;
  oceanFront?: boolean;
  hasGarden?: boolean;
  hasGourmetArea?: boolean;
  furnished?: boolean;
}

export interface SemanticSearchHit {
  property: Property;
  score: number;
  distance: number;
}

export interface IPropertyRepository {
  save(property: Property): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  findAll(): Promise<Property[]>;
  findByCorretorId(realtorId: string): Promise<Property[]>;
  findByCity(city: string): Promise<Property[]>;
  findByType(type: string): Promise<Property[]>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Property[]>;
  update(id: string, property: Property): Promise<Property>;
  delete(id: string): Promise<boolean>;

  findIdsWithoutEmbedding(provider: EmbeddingProviderName, limit?: number): Promise<string[]>;
  updateEmbedding(id: string, result: EmbeddingResult, chunk: string): Promise<void>;
  /**
   * Invalida o cache do PDF do anúncio (zera adPdfUrl/adPdfPath/adPdfGeneratedAt).
   * Não toca no arquivo no MinIO — a próxima geração sobrescreve no mesmo caminho.
   */
  clearAdPdfCache(id: string): Promise<void>;
  searchBySimilarity(
    provider: EmbeddingProviderName,
    embedding: number[],
    filters: SemanticSearchFilters,
    limit: number,
    minScore: number,
  ): Promise<SemanticSearchHit[]>;
}

