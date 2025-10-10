import { IsString, IsNotEmpty, IsNumber, Min, Max, IsArray, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketCategoryDto {
  @ApiProperty({ example: 'Pista' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Acesso à área principal do evento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  @Max(10000)
  price: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  maxQuantity: number;

  @ApiProperty({ 
    example: ['Acesso à pista principal', 'Banheiros', 'Área de alimentação'],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];
}
