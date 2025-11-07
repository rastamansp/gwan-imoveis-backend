import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateProductQrDto {
  @ApiProperty({ example: 'PRODUCT_abc123...', description: 'Código do QR code do produto' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'scanner-uuid', description: 'ID do atendente/scanner que está validando', required: false })
  @IsOptional()
  @IsString()
  validatedBy?: string;
}

