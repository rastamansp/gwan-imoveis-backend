import { ApiProperty } from '@nestjs/swagger';
import { Artist } from '../../domain/entities/artist.entity';
import { EventResponseDto } from './event-response.dto';
import { SpotifyArtistDataDto } from './spotify/spotify-artist-data.dto';
import { SpotifyTrackDto } from './spotify/spotify-track.dto';
import { SpotifyAlbumDto } from './spotify/spotify-album.dto';
import { SpotifyRelatedArtistDto } from './spotify/spotify-related-artist.dto';

export class ArtistDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Nome artístico do artista' })
  artisticName: string;

  @ApiProperty({ description: 'Nome completo do artista' })
  name: string;

  @ApiProperty({ required: false, description: 'Data de nascimento' })
  birthDate?: Date | null;

  @ApiProperty({ required: false })
  biography?: string | null;

  @ApiProperty({ required: false, description: 'Nome de usuário do Instagram' })
  instagramUsername?: string | null;

  @ApiProperty({ required: false, description: 'Nome de usuário do YouTube' })
  youtubeUsername?: string | null;

  @ApiProperty({ required: false, description: 'Nome de usuário do X/Twitter' })
  xUsername?: string | null;

  @ApiProperty({ required: false, description: 'Nome de usuário do Spotify' })
  spotifyUsername?: string | null;

  @ApiProperty({ required: false, description: 'URL completa do site' })
  siteUrl?: string | null;

  @ApiProperty({ required: false, description: 'Nome de usuário do TikTok' })
  tiktokUsername?: string | null;

  @ApiProperty({ required: false, description: 'URL da imagem do artista' })
  image?: string | null;

  @ApiProperty({ required: false, description: 'Metadados do artista (inclui dados do Spotify se disponível)', type: 'object' })
  metadata?: Record<string, any> | null;

  @ApiProperty({ 
    required: false, 
    description: 'Dados do Spotify do artista (disponível quando artista foi sincronizado com Spotify)',
    type: SpotifyArtistDataDto 
  })
  spotify?: SpotifyArtistDataDto | null;

  @ApiProperty({ type: [EventResponseDto], description: 'Eventos nos quais o artista participa' })
  events: EventResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(artist: Artist): ArtistDetailResponseDto {
    const dto = new ArtistDetailResponseDto();
    dto.id = artist.id;
    dto.artisticName = artist.artisticName;
    dto.name = artist.name;
    dto.birthDate = artist.birthDate || undefined;
    dto.biography = artist.biography || undefined;
    dto.instagramUsername = artist.instagramUsername || undefined;
    dto.youtubeUsername = artist.youtubeUsername || undefined;
    dto.xUsername = artist.xUsername || undefined;
    dto.spotifyUsername = artist.spotifyUsername || undefined;
    dto.siteUrl = artist.siteUrl || undefined;
    dto.tiktokUsername = artist.tiktokUsername || undefined;
    dto.image = artist.image || undefined;
    dto.metadata = artist.metadata || undefined;
    dto.events = (artist.events || []).map(event => EventResponseDto.fromEntity(event));
    dto.createdAt = artist.createdAt;
    dto.updatedAt = artist.updatedAt;
    
    // Extrair e converter dados do Spotify se disponíveis
    dto.spotify = this.extractSpotifyData(artist.metadata);
    
    return dto;
  }

  /**
   * Extrai e converte os dados do Spotify do metadata para o DTO estruturado
   */
  private static extractSpotifyData(metadata: Record<string, any> | null): SpotifyArtistDataDto | null {
    if (!metadata || !metadata.spotify) {
      return null;
    }

    const spotifyData = metadata.spotify;

    try {
      const spotifyDto = new SpotifyArtistDataDto();
      spotifyDto.id = spotifyData.id;
      spotifyDto.name = spotifyData.name;
      spotifyDto.genres = spotifyData.genres || [];
      spotifyDto.popularity = spotifyData.popularity || 0;
      
      // Followers
      spotifyDto.followers = {
        total: spotifyData.followers?.total ?? null,
        href: spotifyData.followers?.href ?? null,
      };

      // Images
      spotifyDto.images = (spotifyData.images || []).map((img: any) => ({
        url: img.url,
        height: img.height ?? null,
        width: img.width ?? null,
      }));

      // External URLs
      spotifyDto.external_urls = {
        spotify: spotifyData.external_urls?.spotify || '',
      };

      // Top Tracks
      spotifyDto.topTracks = (spotifyData.topTracks || []).map((track: any) => {
        const trackDto: SpotifyTrackDto = {
          id: track.id,
          name: track.name,
          duration_ms: track.duration_ms,
          popularity: track.popularity,
          preview_url: track.preview_url ?? null,
          album: {
            id: track.album?.id || '',
            name: track.album?.name || '',
            images: (track.album?.images || []).map((img: any) => ({
              url: img.url,
              height: img.height ?? null,
              width: img.width ?? null,
            })),
          },
        };
        return trackDto;
      });

      // Albums
      spotifyDto.albums = (spotifyData.albums || []).map((album: any) => {
        const albumDto: SpotifyAlbumDto = {
          id: album.id,
          name: album.name,
          release_date: album.release_date,
          total_tracks: album.total_tracks,
          album_type: album.album_type,
          images: (album.images || []).map((img: any) => ({
            url: img.url,
            height: img.height ?? null,
            width: img.width ?? null,
          })),
        };
        return albumDto;
      });

      // Related Artists
      spotifyDto.relatedArtists = (spotifyData.relatedArtists || []).map((artist: any) => {
        const relatedArtistDto: SpotifyRelatedArtistDto = {
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          popularity: artist.popularity || 0,
        };
        return relatedArtistDto;
      });

      return spotifyDto;
    } catch (error) {
      // Se houver erro ao converter, retornar null
      return null;
    }
  }
}

