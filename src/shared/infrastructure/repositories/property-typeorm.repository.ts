import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as pgvector from 'pgvector';
import { Property } from '../../domain/entities/property.entity';
import {
  IPropertyRepository,
  SemanticSearchFilters,
  SemanticSearchHit,
} from '../../domain/interfaces/property-repository.interface';
import {
  EmbeddingProviderName,
  EmbeddingResult,
} from '../services/embedding/embedding-provider.interface';

const PROVIDER_COLUMNS: Record<EmbeddingProviderName, { vector: string; model: string; updatedAt: string }> = {
  voyage: {
    vector: 'embeddingVoyage',
    model: 'embeddingVoyageModel',
    updatedAt: 'embeddingVoyageUpdatedAt',
  },
  openai: {
    vector: 'embeddingOpenai',
    model: 'embeddingOpenaiModel',
    updatedAt: 'embeddingOpenaiUpdatedAt',
  },
};

@Injectable()
export class PropertyTypeOrmRepository implements IPropertyRepository {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async save(property: Property): Promise<Property> {
    return this.propertyRepository.save(property);
  }

  async findById(id: string): Promise<Property | null> {
    return this.propertyRepository.findOne({
      where: { id },
      relations: ['realtor', 'realtor.realtorProfile'],
    });
  }

  async findAll(): Promise<Property[]> {
    return this.propertyRepository.find({
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCorretorId(realtorId: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { realtorId },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCity(city: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { city },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { type: type as any },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Property[]> {
    return this.propertyRepository
      .createQueryBuilder('property')
      .where('property.price >= :minPrice', { minPrice })
      .andWhere('property.price <= :maxPrice', { maxPrice })
      .leftJoinAndSelect('property.realtor', 'realtor')
      .orderBy('property.createdAt', 'DESC')
      .getMany();
  }

  async update(id: string, property: Property): Promise<Property> {
    await this.propertyRepository.update(id, property);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Property not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.propertyRepository.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async findIdsWithoutEmbedding(provider: EmbeddingProviderName, limit = 100): Promise<string[]> {
    const cols = PROVIDER_COLUMNS[provider];
    const rows = await this.propertyRepository.query(
      `SELECT id FROM properties WHERE "${cols.vector}" IS NULL ORDER BY "createdAt" ASC LIMIT $1`,
      [limit],
    );
    return rows.map((r: { id: string }) => r.id);
  }

  async clearAdPdfCache(id: string): Promise<void> {
    await this.propertyRepository.update(id, {
      adPdfUrl: null,
      adPdfPath: null,
      adPdfGeneratedAt: null,
    });
  }

  async updateEmbedding(id: string, result: EmbeddingResult, chunk: string): Promise<void> {
    const cols = PROVIDER_COLUMNS[result.provider];
    const sql = pgvector.toSql(result.vector);
    await this.propertyRepository.query(
      `UPDATE properties
       SET "${cols.vector}" = $1::vector,
           "${cols.model}" = $2,
           "${cols.updatedAt}" = NOW(),
           "embeddingChunk" = $3,
           "updatedAt" = NOW()
       WHERE id = $4`,
      [sql, result.model, chunk, id],
    );
  }

  async searchBySimilarity(
    provider: EmbeddingProviderName,
    embedding: number[],
    filters: SemanticSearchFilters,
    limit: number,
    minScore: number,
  ): Promise<SemanticSearchHit[]> {
    const cols = PROVIDER_COLUMNS[provider];
    const queryVec = pgvector.toSql(embedding);

    const qb = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.realtor', 'realtor')
      .addSelect(`property."${cols.vector}" <=> :queryVec::vector`, 'distance')
      .where(`property."${cols.vector}" IS NOT NULL`)
      .setParameter('queryVec', queryVec);

    if (filters.city) qb.andWhere('property.city = :city', { city: filters.city });
    if (filters.type) qb.andWhere('property.type = :type', { type: filters.type });
    if (filters.purpose) qb.andWhere('property.purpose = :purpose', { purpose: filters.purpose });
    if (filters.realtorId) qb.andWhere('property.realtorId = :realtorId', { realtorId: filters.realtorId });
    if (filters.minPrice !== undefined) qb.andWhere('property.price >= :minPrice', { minPrice: filters.minPrice });
    if (filters.maxPrice !== undefined) qb.andWhere('property.price <= :maxPrice', { maxPrice: filters.maxPrice });
    if (filters.hasPool === true) qb.andWhere('property.hasPool = TRUE');
    if (filters.hasJacuzzi === true) qb.andWhere('property.hasJacuzzi = TRUE');
    if (filters.oceanFront === true) qb.andWhere('property.oceanFront = TRUE');
    if (filters.hasGarden === true) qb.andWhere('property.hasGarden = TRUE');
    if (filters.hasGourmetArea === true) qb.andWhere('property.hasGourmetArea = TRUE');
    if (filters.furnished === true) qb.andWhere('property.furnished = TRUE');

    if (minScore > 0) {
      const maxDistance = 1 - minScore;
      qb.andWhere(`property."${cols.vector}" <=> :queryVec::vector <= :maxDistance`, { maxDistance });
    }

    qb.orderBy(`property."${cols.vector}" <=> :queryVec::vector`, 'ASC').limit(limit);

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((property, idx) => {
      const distance = parseFloat(raw[idx]?.distance ?? '1');
      return {
        property,
        distance,
        score: 1 - distance,
      };
    });
  }
}
