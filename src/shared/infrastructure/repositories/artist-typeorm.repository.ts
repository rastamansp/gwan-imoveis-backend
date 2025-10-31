import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ArtistSearchFilters } from '../../domain/value-objects/artist-search-filters';

@Injectable()
export class ArtistTypeOrmRepository implements IArtistRepository {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async save(artist: Artist): Promise<Artist> {
    return await this.artistRepository.save(artist);
  }

  async findById(id: string): Promise<Artist | null> {
    return await this.artistRepository.findOne({ where: { id } });
  }

  async findByIdWithEvents(id: string): Promise<Artist | null> {
    return await this.artistRepository.findOne({
      where: { id },
      relations: ['events'],
    });
  }

  async findAll(): Promise<Artist[]> {
    return await this.artistRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async search(filters: ArtistSearchFilters): Promise<Artist[]> {
    const qb = this.artistRepository.createQueryBuilder('artist');

    if (filters.artisticName) {
      const normalized = filters.artisticName.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.artisticName ILIKE :artisticName', { artisticName: `%${normalized}%` });
    }

    if (filters.name) {
      const normalized = filters.name.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.name ILIKE :name', { name: `%${normalized}%` });
    }

    if (filters.instagramUsername) {
      const normalized = filters.instagramUsername.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.instagramUsername ILIKE :instagramUsername', { instagramUsername: `%${normalized}%` });
    }

    if (filters.youtubeUsername) {
      const normalized = filters.youtubeUsername.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.youtubeUsername ILIKE :youtubeUsername', { youtubeUsername: `%${normalized}%` });
    }

    if (filters.xUsername) {
      const normalized = filters.xUsername.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.xUsername ILIKE :xUsername', { xUsername: `%${normalized}%` });
    }

    if (filters.spotifyUsername) {
      const normalized = filters.spotifyUsername.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.spotifyUsername ILIKE :spotifyUsername', { spotifyUsername: `%${normalized}%` });
    }

    if (filters.tiktokUsername) {
      const normalized = filters.tiktokUsername.trim().replace(/\*\*/g, '').replace(/\s+/g, ' ');
      qb.andWhere('artist.tiktokUsername ILIKE :tiktokUsername', { tiktokUsername: `%${normalized}%` });
    }

    qb.orderBy('artist.createdAt', 'DESC');

    return await qb.getMany();
  }

  async findByEventId(eventId: string): Promise<Artist[]> {
    return await this.artistRepository
      .createQueryBuilder('artist')
      .innerJoin('artist.events', 'event', 'event.id = :eventId', { eventId })
      .orderBy('artist.createdAt', 'DESC')
      .getMany();
  }

  async update(id: string, updatedArtist: Artist): Promise<Artist | null> {
    const result = await this.artistRepository.update(id, updatedArtist);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.artistRepository.delete(id);
    return result.affected > 0;
  }

  async linkToEvent(artistId: string, eventId: string): Promise<void> {
    const artist = await this.findById(artistId);
    if (!artist) {
      throw new Error(`Artista ${artistId} não encontrado`);
    }

    // Verificar se já está vinculado
    const existingLink = await this.artistRepository
      .createQueryBuilder('artist')
      .innerJoin('artist.events', 'event', 'event.id = :eventId AND artist.id = :artistId', { eventId, artistId })
      .getOne();

    if (existingLink) {
      return; // Já está vinculado, não fazer nada
    }

    // Vincular usando query SQL direto na tabela de relacionamento
    await this.artistRepository.manager.query(
      `INSERT INTO event_artists (event_id, artist_id) 
       VALUES ($1, $2) 
       ON CONFLICT (event_id, artist_id) DO NOTHING`,
      [eventId, artistId],
    );
  }

  async unlinkFromEvent(artistId: string, eventId: string): Promise<void> {
    await this.artistRepository.manager.query(
      `DELETE FROM event_artists 
       WHERE event_id = $1 AND artist_id = $2`,
      [eventId, artistId],
    );
  }

  async updateEmbedding(artistId: string, metadata: Record<string, any>, embedding: number[], model: string): Promise<void> {
    const updateData: any = {
      metadata,
      embedding,
      embeddingModel: model,
    };

    const result = await this.artistRepository.update(artistId, updateData);
    
    if (result.affected === 0) {
      throw new Error(`Falha ao atualizar embedding: artista ${artistId} não encontrado ou nenhuma linha afetada`);
    }
  }

  async searchByEmbedding(queryEmbedding: number[], limit: number): Promise<Artist[]> {
    // Busca por similaridade de cosseno usando SQL direto
    // Formula: cosine_similarity = dot_product(a, b) / (||a|| * ||b||)
    // Como normalizamos os embeddings, podemos usar apenas o produto escalar
    
    const artists = await this.artistRepository
      .createQueryBuilder('artist')
      .where('artist.embedding IS NOT NULL')
      .getMany();

    // Calcular similaridade para cada artista
    const artistsWithSimilarity = artists
      .filter(artist => artist.embedding && artist.embedding.length === queryEmbedding.length)
      .map(artist => {
        const similarity = this.cosineSimilarity(queryEmbedding, artist.embedding!);
        return { artist, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.artist);

    return artistsWithSimilarity;
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

