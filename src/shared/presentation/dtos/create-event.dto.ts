import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Nome do Evento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'O maior festival de música eletrônica da cidade' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: '2024-06-15T20:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Local do Evento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @ApiProperty({ example: 'Av. das Flores, 123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  image: string;

  @ApiProperty({ example: 'Música' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100000)
  maxCapacity?: number;
}
