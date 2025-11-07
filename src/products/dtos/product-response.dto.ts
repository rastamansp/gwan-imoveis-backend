import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../shared/domain/entities/product.entity';
import { ProductCategory } from '../../shared/domain/value-objects/product-category.enum';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ProductCategory })
  category: ProductCategory;

  @ApiProperty({ nullable: true })
  image: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.eventId = product.eventId;
    dto.name = product.name;
    dto.description = product.description;
    dto.price = product.getPrice();
    dto.category = product.category;
    dto.image = product.image;
    dto.isActive = product.isActive;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}

