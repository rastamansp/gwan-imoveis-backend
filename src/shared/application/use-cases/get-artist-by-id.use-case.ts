import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';

@Injectable()
export class GetArtistByIdUseCase {
  private readonly cacheTtl = 5 * 60; // 5 minutos em segundos

  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async execute(artistId: string, includeEvents: boolean = false): Promise<Artist> {
    const startTime = Date.now();
    const cacheKey = `artist:byId:${artistId}:${includeEvents}`;
    
    this.logger.info('Buscando artista por ID', {
      artistId,
      includeEvents,
      timestamp: new Date().toISOString(),
    });

    // Verificar cache antes de consultar banco
    try {
      const cachedArtist = await this.cacheManager.get<Artist>(cacheKey);
      if (cachedArtist) {
        const duration = Date.now() - startTime;
        this.logger.info('Artista encontrado no cache Redis', {
          artistId,
          artisticName: cachedArtist.artisticName,
          eventsCount: cachedArtist.events?.length || 0,
          duration,
        });
        return cachedArtist;
      }
    } catch (error) {
      // Se Redis não estiver disponível, continuar sem cache
      this.logger.warn('[CACHE] Erro ao verificar cache Redis, continuando sem cache', {
        artistId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const artist = includeEvents
        ? await this.artistRepository.findByIdWithEvents(artistId)
        : await this.artistRepository.findById(artistId);
      
      if (!artist) {
        throw new ArtistNotFoundException(artistId);
      }

      // Salvar no cache Redis
      try {
        await this.cacheManager.set(cacheKey, artist, this.cacheTtl);
        this.logger.debug('Artista cacheado no Redis', {
          artistId,
          includeEvents,
          ttl: this.cacheTtl,
        });
      } catch (error) {
        // Se Redis não estiver disponível, continuar sem cache
        this.logger.warn('[CACHE] Erro ao salvar artista no cache Redis, continuando sem cache', {
          artistId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const duration = Date.now() - startTime;
      this.logger.info('Artista encontrado com sucesso', {
        artistId,
        artisticName: artist.artisticName,
        eventsCount: artist.events?.length || 0,
        duration,
      });

      return artist;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao buscar artista', {
        artistId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

