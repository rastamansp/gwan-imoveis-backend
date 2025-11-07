import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCreditDto {
  @ApiProperty({ example: 100.00, description: 'Valor a ser adicionado aos créditos' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

