import { ApiProperty } from '@nestjs/swagger';
import { Payment } from '../../domain/entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticketId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  method: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  pixCode?: string;

  @ApiProperty()
  pixQrCode?: string;

  @ApiProperty()
  installments?: number;

  @ApiProperty()
  transactionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  approvedAt?: Date;

  @ApiProperty()
  refundedAt?: Date;

  static fromEntity(payment: Payment): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.ticketId = payment.ticketId;
    dto.userId = payment.userId;
    dto.amount = payment.amount;
    dto.method = payment.method;
    dto.status = payment.status;
    dto.pixCode = payment.pixCode;
    dto.pixQrCode = payment.pixQrCode;
    dto.installments = payment.installments;
    dto.transactionId = payment.transactionId;
    dto.createdAt = payment.createdAt;
    dto.approvedAt = payment.approvedAt;
    dto.refundedAt = payment.refundedAt;
    return dto;
  }
}
