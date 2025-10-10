import { IsString, IsOptional, IsDateString, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiProperty({ example: 'Festival de Música Eletrônica', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ example: 'O maior festival de música eletrônica da cidade', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2024-06-15T20:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'Parque da Cidade', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: 'Av. das Flores, 123', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: 'São Paulo', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ example: 'SP', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @ApiProperty({ example: 'Música', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  maxCapacity?: number;
}
