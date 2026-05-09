import { ApiProperty } from '@nestjs/swagger';
import { PropertyResponseDto } from './property-response.dto';

export class PropertySearchResultDto {
  @ApiProperty({ type: PropertyResponseDto })
  property: PropertyResponseDto;

  @ApiProperty({ description: 'Similaridade cosseno (1.0 = idêntico, 0.0 = ortogonal)', example: 0.87 })
  score: number;

  @ApiProperty({ description: 'Distância cosseno (1 - score)', example: 0.13 })
  distance: number;
}
