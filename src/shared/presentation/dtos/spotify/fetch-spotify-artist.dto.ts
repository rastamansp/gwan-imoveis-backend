import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FetchSpotifyArtistDto {
  @ApiProperty({
    example: 'https://open.spotify.com/intl-pt/artist/6nynI5RNNt5DJ9gB4jCRTb',
    description: 'URL completa do artista no Spotify',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  spotifyUrl: string;

  @ApiProperty({
    example: '76bf12c5-e800-4790-9de9-9165885e907f',
    required: false,
    description: 'ID do artista no banco de dados (opcional). Se fornecido, atualiza o artista existente. Se não fornecido, cria um novo artista. Deve ser um UUID válido.',
  })
  @IsOptional()
  @IsString()
  artistId?: string;
}

