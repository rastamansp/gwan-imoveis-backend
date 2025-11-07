import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../shared/domain/value-objects/product-category.enum';

export class CreateProductDto {
  @ApiProperty({ example: '89a91565-38eb-4dea-8166-ac251617fa72', description: 'ID do evento' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'Cerveja Artesanal', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Cerveja artesanal premium', description: 'Descrição do produto', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15.50, description: 'Preço do produto' })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty({ example: ProductCategory.BEBIDA, description: 'Categoria do produto', enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL da imagem do produto', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, description: 'Se o produto está ativo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

