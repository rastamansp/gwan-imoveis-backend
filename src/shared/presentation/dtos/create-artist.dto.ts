import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArtistDto {
  @ApiProperty({ example: 'Nome Artístico', description: 'Nome artístico do artista' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  artisticName: string;

  @ApiProperty({ example: 'Nome Completo', description: 'Nome completo do artista' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '1990-01-01', required: false, description: 'Data de nascimento' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ example: 'Biografia do artista...', required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ example: 'artistname', required: false, description: 'Nome de usuário do Instagram (sem URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  instagramUsername?: string;

  @ApiProperty({ example: 'artistname', required: false, description: 'Nome de usuário do YouTube (sem URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  youtubeUsername?: string;

  @ApiProperty({ example: 'artistname', required: false, description: 'Nome de usuário do X/Twitter (sem URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  xUsername?: string;

  @ApiProperty({ example: 'artistname', required: false, description: 'Nome de usuário do Spotify (sem URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  spotifyUsername?: string;

  @ApiProperty({ example: 'https://artista.com.br', required: false, description: 'URL completa do site do artista' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  siteUrl?: string;

  @ApiProperty({ example: 'artistname', required: false, description: 'Nome de usuário do TikTok (sem URL)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tiktokUsername?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', required: false, description: 'URL da imagem do artista' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  image?: string;
}

