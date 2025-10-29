import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsInt, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCategoryDto {
  @ApiProperty({
    description: 'Nome da categoria de ingresso',
    example: 'Pista',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Descrição da categoria de ingresso',
    example: 'Acesso à pista principal com barracas de comida',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Preço da categoria de ingresso em reais',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Quantidade máxima de ingressos disponíveis para esta categoria',
    example: 800,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  maxQuantity: number;

  @ApiProperty({
    description: 'Lista de benefícios incluídos na categoria',
    example: ['Acesso à pista', 'Barracas de comida', 'Estacionamento'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];
}