import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkArtistToEventDto {
  @ApiProperty({ example: 'uuid-do-artista', description: 'ID do artista a ser vinculado' })
  @IsUUID()
  @IsNotEmpty()
  artistId: string;
}

