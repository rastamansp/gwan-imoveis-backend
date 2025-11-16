import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../../../shared/domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../../../shared/domain/value-objects/property-purpose.enum';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Título do anúncio do imóvel',
    example: 'Casa de Praia Luxuosa com Vista para o Mar',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do imóvel',
    example: 'Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina. Localizada em frente ao mar.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Tipo do imóvel',
    enum: PropertyType,
    example: PropertyType.CASA,
  })
  @IsEnum(PropertyType)
  @IsNotEmpty()
  type: PropertyType;

  @ApiPropertyOptional({
    description: 'Finalidade do imóvel (RENT=Aluguel, SALE=Venda, INVESTMENT=Investimento). Se não fornecido, o padrão é RENT.',
    enum: PropertyPurpose,
    example: PropertyPurpose.RENT,
    default: PropertyPurpose.RENT,
  })
  @IsOptional()
  @IsEnum(PropertyPurpose)
  purpose?: PropertyPurpose;

  @ApiProperty({
    description: 'Preço do imóvel em reais',
    example: 850000.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Bairro ou praia onde o imóvel está localizado',
    example: 'Maresias',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade onde o imóvel está localizado',
    example: 'São Sebastião',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @ApiPropertyOptional({
    description: 'Número de quartos',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Número de banheiros',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({
    description: 'Área total do imóvel em metros quadrados',
    example: 150.50,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  area: number;

  @ApiPropertyOptional({
    description: 'Número de vagas de garagem',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  garageSpaces?: number;

  @ApiPropertyOptional({
    description: 'Has swimming pool',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasPool?: boolean;

  @ApiPropertyOptional({
    description: 'Has jacuzzi',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasJacuzzi?: boolean;

  @ApiPropertyOptional({
    description: 'Ocean front property',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  oceanFront?: boolean;

  @ApiPropertyOptional({
    description: 'Has garden',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasGarden?: boolean;

  @ApiPropertyOptional({
    description: 'Has gourmet area',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasGourmetArea?: boolean;

  @ApiPropertyOptional({
    description: 'Furnished property',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;
}

