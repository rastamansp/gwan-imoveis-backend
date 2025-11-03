import { ApiProperty } from '@nestjs/swagger';

export class SpotifyRelatedArtistDto {
  @ApiProperty({ description: 'ID do artista no Spotify' })
  id: string;

  @ApiProperty({ description: 'Nome do artista' })
  name: string;

  @ApiProperty({ type: [String], description: 'Gêneros musicais do artista' })
  genres: string[];

  @ApiProperty({ description: 'Popularidade do artista (0-100)' })
  popularity: number;
}

