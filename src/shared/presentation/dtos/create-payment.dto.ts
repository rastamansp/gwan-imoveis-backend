import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../domain/value-objects/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  ticketId: string;

  @ApiProperty({ example: PaymentMethod.PIX, enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;
}
