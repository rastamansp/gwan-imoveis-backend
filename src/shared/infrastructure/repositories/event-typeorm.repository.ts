import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../domain/entities/event.entity';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';

@Injectable()
export class EventTypeOrmRepository implements IEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async save(event: Event): Promise<Event> {
    return await this.eventRepository.save(event);
  }

  async findById(id: string): Promise<Event | null> {
    return await this.eventRepository.findOne({ where: { id } });
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { organizerId },
      order: { createdAt: 'DESC' }
    });
  }

  async findAll(): Promise<Event[]> {
    return await this.eventRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByCategory(category: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { category },
      order: { createdAt: 'DESC' }
    });
  }

  async findByCity(city: string): Promise<Event[]> {
    return await this.eventRepository.find({ 
      where: { city },
      order: { createdAt: 'DESC' }
    });
  }

  async findByCode(code: string): Promise<Event | null> {
    return await this.eventRepository.findOne({ where: { code } });
  }

  async searchByNameOrCode(query: string): Promise<Event[]> {
    const normalizedQuery = query.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
    const qb = this.eventRepository.createQueryBuilder('e');
    qb.where('e.title ILIKE :q', { q: `%${normalizedQuery}%` })
      .orWhere('e.code ILIKE :q', { q: `%${normalizedQuery}%` })
      .orderBy('e.createdAt', 'DESC');
    return await qb.getMany();
  }

  async update(id: string, updatedEvent: Event): Promise<Event | null> {
    const result = await this.eventRepository.update(id, updatedEvent);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.eventRepository.delete(id);
    return result.affected > 0;
  }

  async updateEmbedding(eventId: string, metadata: Record<string, any>, embedding: number[], model: string): Promise<void> {
    const updateData: any = {
      metadata,
      embedding,
      embeddingModel: model,
    };

    const result = await this.eventRepository.update(eventId, updateData);
    
    if (result.affected === 0) {
      throw new Error(`Falha ao atualizar embedding: evento ${eventId} não encontrado ou nenhuma linha afetada`);
    }
  }

  async searchByEmbedding(queryEmbedding: number[], limit: number): Promise<Event[]> {
    // Busca por similaridade de cosseno usando SQL direto
    // Formula: cosine_similarity = dot_product(a, b) / (||a|| * ||b||)
    // Como normalizamos os embeddings, podemos usar apenas o produto escalar
    
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.embedding IS NOT NULL')
      .andWhere('event.status = :status', { status: 'ACTIVE' })
      .getMany();

    // Calcular similaridade para cada evento
    const eventsWithSimilarity = events
      .filter(event => event.embedding && event.embedding.length === queryEmbedding.length)
      .map(event => {
        const similarity = this.cosineSimilarity(queryEmbedding, event.embedding!);
        return { event, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.event);

    return eventsWithSimilarity;
  }

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
