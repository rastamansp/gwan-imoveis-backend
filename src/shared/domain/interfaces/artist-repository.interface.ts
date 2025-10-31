import { Artist } from '../entities/artist.entity';
import { ArtistSearchFilters } from '../value-objects/artist-search-filters';

export interface IArtistRepository {
  save(artist: Artist): Promise<Artist>;
  findById(id: string): Promise<Artist | null>;
  findByIdWithEvents(id: string): Promise<Artist | null>;
  findAll(): Promise<Artist[]>;
  search(filters: ArtistSearchFilters): Promise<Artist[]>;
  findByEventId(eventId: string): Promise<Artist[]>;
  update(id: string, artist: Artist): Promise<Artist | null>;
  delete(id: string): Promise<boolean>;
  linkToEvent(artistId: string, eventId: string): Promise<void>;
  unlinkFromEvent(artistId: string, eventId: string): Promise<void>;
  updateEmbedding(artistId: string, metadata: Record<string, any>, embedding: number[], model: string): Promise<void>;
  searchByEmbedding(queryEmbedding: number[], limit: number): Promise<Artist[]>;
}

