import { ApiProperty } from '@nestjs/swagger';
import { Artist } from '../../domain/entities/artist.entity';

export class ArtistResponseDto {
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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(artist: Artist): ArtistResponseDto {
    const dto = new ArtistResponseDto();
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
    dto.createdAt = artist.createdAt;
    dto.updatedAt = artist.updatedAt;
    return dto;
  }
}

