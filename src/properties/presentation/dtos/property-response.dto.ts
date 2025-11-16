import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Property } from '../../../shared/domain/entities/property.entity';
import { PropertyType } from '../../../shared/domain/value-objects/property-type.enum';

export class PropertyResponseDto {
  @ApiProperty({
    description: 'ID único do imóvel',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  id: string;

  @ApiProperty({
    description: 'Título do anúncio',
    example: 'Casa de Praia Luxuosa com Vista para o Mar',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição do imóvel',
    example: 'Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina.',
  })
  description: string;

  @ApiProperty({
    description: 'Tipo do imóvel',
    enum: PropertyType,
    example: PropertyType.CASA,
  })
  type: PropertyType;

  @ApiProperty({
    description: 'Preço em reais',
    example: 850000.00,
  })
  price: number;

  @ApiProperty({
    description: 'Bairro ou praia',
    example: 'Maresias',
  })
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Sebastião',
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Número de quartos',
    example: 3,
  })
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Número de banheiros',
    example: 2,
  })
  bathrooms?: number;

  @ApiProperty({
    description: 'Área em metros quadrados',
    example: 150.50,
  })
  area: number;

  @ApiPropertyOptional({
    description: 'Número de vagas de garagem',
    example: 2,
  })
  garageSpaces?: number;

  @ApiProperty({
    description: 'Possui piscina',
    example: true,
  })
  piscina: boolean;

  @ApiProperty({
    description: 'Possui hidromassagem',
    example: false,
  })
  hidromassagem: boolean;

  @ApiProperty({
    description: 'Frente para o mar',
    example: true,
  })
  frenteMar: boolean;

  @ApiProperty({
    description: 'Possui jardim',
    example: true,
  })
  jardim: boolean;

  @ApiProperty({
    description: 'Possui área gourmet',
    example: true,
  })
  areaGourmet: boolean;

  @ApiProperty({
    description: 'Imóvel mobiliado',
    example: false,
  })
  mobiliado: boolean;

  @ApiProperty({
    description: 'ID do corretor responsável',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  corretorId: string;

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

  static fromEntity(property: Property): PropertyResponseDto {
    const dto = new PropertyResponseDto();
    dto.id = property.id;
    dto.title = property.title;
    dto.description = property.description;
    dto.type = property.type;
    dto.price = Number(property.price);
    dto.neighborhood = property.neighborhood;
    dto.city = property.city;
    dto.bedrooms = property.bedrooms;
    dto.bathrooms = property.bathrooms;
    dto.area = Number(property.area);
    dto.garageSpaces = property.garageSpaces;
    dto.piscina = property.piscina;
    dto.hidromassagem = property.hidromassagem;
    dto.frenteMar = property.frenteMar;
    dto.jardim = property.jardim;
    dto.areaGourmet = property.areaGourmet;
    dto.mobiliado = property.mobiliado;
    dto.corretorId = property.corretorId;
    dto.createdAt = property.createdAt;
    dto.updatedAt = property.updatedAt;
    return dto;
  }
}

