import { ApiProperty } from '@nestjs/swagger';
import { SpotifyImageDto } from './spotify-image.dto';

export class SpotifyAlbumDto {
  @ApiProperty({ description: 'ID do álbum no Spotify' })
  id: string;

  @ApiProperty({ description: 'Nome do álbum' })
  name: string;

  @ApiProperty({ description: 'Data de lançamento do álbum' })
  release_date: string;

  @ApiProperty({ description: 'Número total de faixas no álbum' })
  total_tracks: number;

  @ApiProperty({ type: [SpotifyImageDto], description: 'Imagens do álbum' })
  images: SpotifyImageDto[];

  @ApiProperty({ description: 'Tipo do álbum (album, single, compilation, appears_on)' })
  album_type: string;
}

