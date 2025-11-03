import { Injectable, Inject } from '@nestjs/common';
import { Artist } from '../../domain/entities/artist.entity';
import { IArtistRepository } from '../../domain/interfaces/artist-repository.interface';
import { ISpotifyService } from '../interfaces/spotify-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { FetchSpotifyArtistDto } from '../../presentation/dtos/spotify/fetch-spotify-artist.dto';
import { SpotifyIntegrationException } from '../../domain/exceptions/spotify-integration.exception';
import { ArtistNotFoundException } from '../../domain/exceptions/artist-not-found.exception';
import { v4 as uuidv4, validate as validateUUID } from 'uuid';

@Injectable()
export class FetchAndUpdateArtistFromSpotifyUseCase {
  constructor(
    @Inject('IArtistRepository')
    private readonly artistRepository: IArtistRepository,
    @Inject('ISpotifyService')
    private readonly spotifyService: ISpotifyService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(dto: FetchSpotifyArtistDto): Promise<Artist> {
    const startTime = Date.now();

    this.logger.info('Iniciando busca e atualização de artista do Spotify', {
      spotifyUrl: dto.spotifyUrl,
      artistId: dto.artistId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Extrair ID do artista da URL do Spotify
      const spotifyId = this.spotifyService.extractArtistIdFromUrl(dto.spotifyUrl);

      this.logger.info('ID do Spotify extraído', {
        spotifyId,
        spotifyUrl: dto.spotifyUrl,
      });

      // Buscar dados do Spotify
      const spotifyData = await this.spotifyService.fetchArtistData(spotifyId);

      // Validar UUID se artistId foi fornecido
      if (dto.artistId && !validateUUID(dto.artistId)) {
        this.logger.warn('artistId fornecido não é um UUID válido', {
          artistId: dto.artistId,
        });
        throw new SpotifyIntegrationException(
          `artistId deve ser um UUID válido. Valor recebido: ${dto.artistId}`,
          'INVALID_UUID',
        );
      }

      // Buscar ou criar artista no banco
      let artist: Artist;

      if (dto.artistId) {
        // Atualizar artista existente
        artist = await this.artistRepository.findById(dto.artistId);
        if (!artist) {
          throw new ArtistNotFoundException(dto.artistId);
        }

        this.logger.info('Artista encontrado no banco, atualizando com dados do Spotify', {
          artistId: artist.id,
          artisticName: artist.artisticName,
          spotifyId,
        });
      } else {
        // Criar novo artista
        this.logger.info('Criando novo artista com dados do Spotify', {
          spotifyId,
          spotifyName: spotifyData.name,
        });

        artist = Artist.create(
          uuidv4(),
          spotifyData.name, // artisticName
          spotifyData.name, // name (inicialmente igual ao artisticName)
          null, // birthDate
          null, // biography
          null, // instagramUsername
          null, // youtubeUsername
          null, // xUsername
          spotifyId, // spotifyUsername
          null, // siteUrl
          null, // tiktokUsername
          spotifyData.images.length > 0 ? spotifyData.images[0].url : null, // image
          new Date(),
          new Date(),
        );
      }

      // Atualizar campos do artista com dados do Spotify
      artist.artisticName = spotifyData.name;
      // Sempre atualizar spotifyUsername com o ID do Spotify para manter consistência
      artist.spotifyUsername = spotifyId;
      // Atualizar imagem se disponível no Spotify e ainda não tiver imagem ou a atual for de placeholder
      if (spotifyData.images.length > 0) {
        if (!artist.image || artist.image.includes('encrypted-tbn') || artist.image.includes('unsplash')) {
          artist.image = spotifyData.images[0].url;
        }
      }

      // Salvar dados completos do Spotify em metadata
      artist.metadata = {
        ...(artist.metadata || {}),
        spotify: {
          id: spotifyData.id,
          name: spotifyData.name,
          genres: spotifyData.genres,
          popularity: spotifyData.popularity,
          followers: spotifyData.followers,
          images: spotifyData.images,
          external_urls: spotifyData.external_urls,
          topTracks: spotifyData.topTracks,
          albums: spotifyData.albums,
          relatedArtists: spotifyData.relatedArtists,
        },
      };

      // Salvar artista
      const savedArtist = await this.artistRepository.save(artist);

      const duration = Date.now() - startTime;
      this.logger.info('Artista atualizado com sucesso usando dados do Spotify', {
        artistId: savedArtist.id,
        artisticName: savedArtist.artisticName,
        spotifyId,
        duration,
      });

      return savedArtist;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof SpotifyIntegrationException || error instanceof ArtistNotFoundException) {
        throw error;
      }

      this.logger.error('Erro ao buscar e atualizar artista do Spotify', {
        spotifyUrl: dto.spotifyUrl,
        artistId: dto.artistId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
      });

      throw error;
    }
  }
}

