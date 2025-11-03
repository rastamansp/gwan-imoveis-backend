import { ApiProperty } from '@nestjs/swagger';

export class SpotifyImageDto {
  @ApiProperty({ description: 'URL da imagem' })
  url: string;

  @ApiProperty({ description: 'Altura da imagem em pixels', nullable: true })
  height: number | null;

  @ApiProperty({ description: 'Largura da imagem em pixels', nullable: true })
  width: number | null;
}

