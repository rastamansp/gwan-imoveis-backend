import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TicketPurchaseDto {
  @ApiProperty({ example: 'cat-uuid-1' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PaymentDataDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @IsNotEmpty()
  expiryMonth: string;

  @ApiProperty({ example: '2025' })
  @IsString()
  @IsNotEmpty()
  expiryYear: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  cvv: string;

  @ApiProperty({ example: 'JOÃO SILVA' })
  @IsString()
  @IsNotEmpty()
  holderName: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ example: 'event-uuid-1' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ type: [TicketPurchaseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketPurchaseDto)
  tickets: TicketPurchaseDto[];

  @ApiProperty({ example: 'credit_card' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ type: PaymentDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDataDto)
  paymentData: PaymentDataDto;
}
