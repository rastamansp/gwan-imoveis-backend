import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;
}
