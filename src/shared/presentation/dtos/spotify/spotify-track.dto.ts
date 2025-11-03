import { ApiProperty } from '@nestjs/swagger';
import { SpotifyImageDto } from './spotify-image.dto';

export class SpotifyTrackAlbumDto {
  @ApiProperty({ description: 'ID do álbum no Spotify' })
  id: string;

  @ApiProperty({ description: 'Nome do álbum' })
  name: string;

  @ApiProperty({ type: [SpotifyImageDto], description: 'Imagens do álbum' })
  images: SpotifyImageDto[];
}

export class SpotifyTrackDto {
  @ApiProperty({ description: 'ID da música no Spotify' })
  id: string;

  @ApiProperty({ description: 'Nome da música' })
  name: string;

  @ApiProperty({ description: 'Duração da música em milissegundos' })
  duration_ms: number;

  @ApiProperty({ description: 'Popularidade da música (0-100)' })
  popularity: number;

  @ApiProperty({ description: 'URL de preview da música', nullable: true })
  preview_url: string | null;

  @ApiProperty({ type: SpotifyTrackAlbumDto, description: 'Informações do álbum' })
  album: SpotifyTrackAlbumDto;
}

