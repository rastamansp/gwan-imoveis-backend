import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';

export class ArtistSearchFiltersDto {
  @ApiProperty({ required: false, description: 'Buscar por nome artístico' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  artisticName?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome completo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome de usuário do Instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  instagramUsername?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome de usuário do YouTube' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  youtubeUsername?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome de usuário do X/Twitter' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  xUsername?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome de usuário do Spotify' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  spotifyUsername?: string;

  @ApiProperty({ required: false, description: 'Buscar por nome de usuário do TikTok' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tiktokUsername?: string;
}

