import { ApiProperty } from '@nestjs/swagger';

export class CreditBalanceResponseDto {
  @ApiProperty({ example: 150.50, description: 'Saldo atual de créditos' })
  balance: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Data da última atualização' })
  updatedAt: Date;
}

