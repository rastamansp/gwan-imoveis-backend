import { IsString, IsOptional, IsNumber, Min, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../../shared/domain/value-objects/product-category.enum';

export class UpdateProductDto {
  @ApiProperty({ example: 'Cerveja Artesanal', description: 'Nome do produto', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Cerveja artesanal premium', description: 'Descrição do produto', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15.50, description: 'Preço do produto', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  price?: number;

  @ApiProperty({ example: ProductCategory.BEBIDA, description: 'Categoria do produto', enum: ProductCategory, required: false })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL da imagem do produto', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, description: 'Se o produto está ativo', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

