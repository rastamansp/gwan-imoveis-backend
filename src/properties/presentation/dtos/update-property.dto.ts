import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../../../shared/domain/value-objects/property-type.enum';

export class UpdatePropertyDto {
  @ApiPropertyOptional({
    description: 'Título do anúncio do imóvel',
    example: 'Casa de Praia Luxuosa com Vista para o Mar',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do imóvel',
    example: 'Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do imóvel',
    enum: PropertyType,
    example: PropertyType.CASA,
  })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({
    description: 'Preço do imóvel em reais',
    example: 850000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Bairro ou praia onde o imóvel está localizado',
    example: 'Maresias',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  neighborhood?: string;

  @ApiPropertyOptional({
    description: 'Cidade onde o imóvel está localizado',
    example: 'São Sebastião',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

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

  @ApiPropertyOptional({
    description: 'Área total do imóvel em metros quadrados',
    example: 150.50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  area?: number;

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
    description: 'Possui piscina',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  piscina?: boolean;

  @ApiPropertyOptional({
    description: 'Possui hidromassagem',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hidromassagem?: boolean;

  @ApiPropertyOptional({
    description: 'Frente para o mar',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  frenteMar?: boolean;

  @ApiPropertyOptional({
    description: 'Possui jardim',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  jardim?: boolean;

  @ApiPropertyOptional({
    description: 'Possui área gourmet',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  areaGourmet?: boolean;

  @ApiPropertyOptional({
    description: 'Imóvel mobiliado',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  mobiliado?: boolean;
}

