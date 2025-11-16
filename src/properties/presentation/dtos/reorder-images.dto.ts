import { IsArray, IsString, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImageOrderItem {
  @ApiProperty({
    description: 'ID da imagem',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  @IsString()
  imageId: string;

  @ApiProperty({
    description: 'Nova ordem da imagem',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  order: number;
}

export class ReorderImagesDto {
  @ApiProperty({
    description: 'Array com IDs das imagens e suas novas ordens',
    type: [ImageOrderItem],
    example: [
      { imageId: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5', order: 0 },
      { imageId: 'e5eb12f4-3g6b-5feg-9gb4-82g373f15fc6', order: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderItem)
  images: ImageOrderItem[];
}

