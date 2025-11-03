import { ApiProperty } from '@nestjs/swagger';
import { SpotifyImageDto } from './spotify-image.dto';
import { SpotifyTrackDto } from './spotify-track.dto';
import { SpotifyAlbumDto } from './spotify-album.dto';
import { SpotifyRelatedArtistDto } from './spotify-related-artist.dto';

export class SpotifyFollowersDto {
  @ApiProperty({ description: 'Número total de seguidores', nullable: true })
  total: number | null;

  @ApiProperty({ description: 'URL para buscar mais seguidores', nullable: true })
  href: string | null;
}

export class SpotifyExternalUrlsDto {
  @ApiProperty({ description: 'URL do artista no Spotify' })
  spotify: string;
}

export class SpotifyArtistDataDto {
  @ApiProperty({ description: 'ID do artista no Spotify' })
  id: string;

  @ApiProperty({ description: 'Nome do artista no Spotify' })
  name: string;

  @ApiProperty({ type: [String], description: 'Gêneros musicais do artista' })
  genres: string[];

  @ApiProperty({ description: 'Popularidade do artista (0-100)' })
  popularity: number;

  @ApiProperty({ type: SpotifyFollowersDto, description: 'Informações sobre seguidores' })
  followers: SpotifyFollowersDto;

  @ApiProperty({ type: [SpotifyImageDto], description: 'Imagens do artista' })
  images: SpotifyImageDto[];

  @ApiProperty({ type: SpotifyExternalUrlsDto, description: 'URLs externas do artista' })
  external_urls: SpotifyExternalUrlsDto;

  @ApiProperty({ type: [SpotifyTrackDto], description: 'Top músicas do artista' })
  topTracks: SpotifyTrackDto[];

  @ApiProperty({ type: [SpotifyAlbumDto], description: 'Álbuns do artista' })
  albums: SpotifyAlbumDto[];

  @ApiProperty({ type: [SpotifyRelatedArtistDto], description: 'Artistas relacionados' })
  relatedArtists: SpotifyRelatedArtistDto[];
}

