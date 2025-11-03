import { Injectable, Inject, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ISpotifyService, SpotifyArtistData } from '../../application/interfaces/spotify-service.interface';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyIntegrationException } from '../../domain/exceptions/spotify-integration.exception';
import { ILogger } from '../../application/interfaces/logger.interface';

interface SpotifyArtistResponse {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string; height: number | null; width: number | null }>;
  external_urls: { spotify: string };
}

interface SpotifyTopTracksResponse {
  tracks: Array<{
    id: string;
    name: string;
    duration_ms: number;
    popularity: number;
    preview_url: string | null;
    album: {
      id: string;
      name: string;
      images: Array<{ url: string; height: number | null; width: number | null }>;
    };
  }>;
}

interface SpotifyAlbumsResponse {
  items: Array<{
    id: string;
    name: string;
    release_date: string;
    total_tracks: number;
    images: Array<{ url: string; height: number | null; width: number | null }>;
    album_type: string;
  }>;
}

interface SpotifyRelatedArtistsResponse {
  artists: Array<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
  }>;
}

@Injectable()
export class SpotifyService implements ISpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly apiBaseUrl = 'https://api.spotify.com/v1';

  constructor(
    private readonly spotifyAuthService: SpotifyAuthService,
    @Inject('ILogger')
    private readonly appLogger: ILogger,
  ) {}

  extractArtistIdFromUrl(spotifyUrl: string): string {
    this.logger.debug('Extraindo ID da URL do Spotify', { spotifyUrl });

    // Regex para diferentes formatos de URL do Spotify
    // Suporta: https://open.spotify.com/artist/ID
    //          https://open.spotify.com/intl-pt/artist/ID
    //          spotify:artist:ID
    const patterns = [
      /\/artist\/([a-zA-Z0-9]+)/,
      /spotify:artist:([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = spotifyUrl.match(pattern);
      if (match && match[1]) {
        this.logger.debug('ID extraído com sucesso', { spotifyId: match[1] });
        return match[1];
      }
    }

    throw SpotifyIntegrationException.invalidUrl(spotifyUrl);
  }

  async fetchArtistData(spotifyId: string): Promise<SpotifyArtistData> {
    const startTime = Date.now();
    
    this.appLogger.info('Iniciando busca de dados do artista no Spotify', {
      spotifyId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Obter token de acesso
      const accessToken = await this.spotifyAuthService.getAccessToken();

      // Fazer requisições paralelas para otimizar performance
      const [artist, topTracks, albums, relatedArtists] = await Promise.all([
        this.fetchArtist(accessToken, spotifyId),
        this.fetchTopTracks(accessToken, spotifyId),
        this.fetchAlbums(accessToken, spotifyId),
        this.fetchRelatedArtists(accessToken, spotifyId),
      ]);

      const spotifyData: SpotifyArtistData = {
        ...artist,
        topTracks,
        albums,
        relatedArtists,
      };

      const duration = Date.now() - startTime;
      this.appLogger.info('Dados do artista obtidos com sucesso do Spotify', {
        spotifyId,
        artistName: artist.name,
        topTracksCount: topTracks.length,
        albumsCount: albums.length,
        relatedArtistsCount: relatedArtists.length,
        duration,
      });

      return spotifyData;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof SpotifyIntegrationException) {
        throw error;
      }

      this.appLogger.error('Erro ao buscar dados do artista no Spotify', {
        spotifyId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response?.status === 401) {
          throw SpotifyIntegrationException.authenticationFailed();
        }
        
        if (axiosError.response?.status === 404) {
          throw SpotifyIntegrationException.artistNotFound(spotifyId);
        }

        const errorMessage = axiosError.response?.data 
          ? (typeof axiosError.response.data === 'string' 
              ? axiosError.response.data 
              : JSON.stringify(axiosError.response.data))
          : axiosError.message;
        
        throw SpotifyIntegrationException.apiError(errorMessage);
      }

      throw SpotifyIntegrationException.apiError(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async fetchArtist(accessToken: string, spotifyId: string): Promise<SpotifyArtistResponse> {
    const response = await axios.get<SpotifyArtistResponse>(
      `${this.apiBaseUrl}/artists/${spotifyId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 10000,
      },
    );

    return response.data;
  }

  private async fetchTopTracks(accessToken: string, spotifyId: string): Promise<SpotifyArtistData['topTracks']> {
    try {
      const response = await axios.get<SpotifyTopTracksResponse>(
        `${this.apiBaseUrl}/artists/${spotifyId}/top-tracks?market=BR`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      return response.data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        preview_url: track.preview_url,
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images,
        },
      }));
    } catch (error) {
      this.logger.warn('Erro ao buscar top tracks, retornando array vazio', {
        spotifyId,
        error: axios.isAxiosError(error) ? error.message : String(error),
      });
      return [];
    }
  }

  private async fetchAlbums(accessToken: string, spotifyId: string): Promise<SpotifyArtistData['albums']> {
    try {
      const response = await axios.get<SpotifyAlbumsResponse>(
        `${this.apiBaseUrl}/artists/${spotifyId}/albums?include_groups=album,single,appears_on,compilation&limit=50&market=BR`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      return response.data.items.map(album => ({
        id: album.id,
        name: album.name,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        images: album.images,
        album_type: album.album_type,
      }));
    } catch (error) {
      this.logger.warn('Erro ao buscar álbuns, retornando array vazio', {
        spotifyId,
        error: axios.isAxiosError(error) ? error.message : String(error),
      });
      return [];
    }
  }

  private async fetchRelatedArtists(accessToken: string, spotifyId: string): Promise<SpotifyArtistData['relatedArtists']> {
    try {
      const response = await axios.get<SpotifyRelatedArtistsResponse>(
        `${this.apiBaseUrl}/artists/${spotifyId}/related-artists`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 10000,
        },
      );

      return response.data.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
      }));
    } catch (error) {
      this.logger.warn('Erro ao buscar artistas relacionados, retornando array vazio', {
        spotifyId,
        error: axios.isAxiosError(error) ? error.message : String(error),
      });
      return [];
    }
  }
}

