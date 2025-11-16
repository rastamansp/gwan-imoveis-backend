import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyImage } from '../../../shared/domain/entities/property-image.entity';

export class PropertyImageResponseDto {
  @ApiProperty({
    description: 'ID único da imagem',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  id: string;

  @ApiProperty({
    description: 'ID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  propertyId: string;

  @ApiProperty({
    description: 'URL da imagem original',
    example: 'https://minio.gwan.com.br:9000/gwan-imoveis-uploads/properties/123/original-image.jpg',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'URL do thumbnail da imagem',
    example: 'https://minio.gwan.com.br:9000/gwan-imoveis-uploads/properties/123/thumb-image.jpg',
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Indica se é a imagem de capa',
    example: true,
  })
  isCover: boolean;

  @ApiProperty({
    description: 'Ordem da imagem na galeria',
    example: 0,
  })
  order: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(image: PropertyImage): PropertyImageResponseDto {
    const dto = new PropertyImageResponseDto();
    dto.id = image.id;
    dto.propertyId = image.propertyId;
    dto.url = image.url;
    dto.thumbnailUrl = image.thumbnailUrl;
    dto.isCover = image.isCover;
    dto.order = image.order;
    dto.createdAt = image.createdAt;
    dto.updatedAt = image.updatedAt;
    return dto;
  }
}

