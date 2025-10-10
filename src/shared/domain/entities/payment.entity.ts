import { PaymentStatus } from '../value-objects/payment-status.enum';
import { PaymentMethod } from '../value-objects/payment-method.enum';

export class Payment {
  constructor(
    public readonly id: string,
    public readonly ticketId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly method: PaymentMethod,
    public readonly status: PaymentStatus = PaymentStatus.PENDING,
    public readonly pixCode?: string,
    public readonly pixQrCode?: string,
    public readonly installments?: number,
    public readonly transactionId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly approvedAt?: Date,
    public readonly refundedAt?: Date,
  ) {}

  // Métodos de domínio
  public isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  public isApproved(): boolean {
    return this.status === PaymentStatus.APPROVED;
  }

  public isRejected(): boolean {
    return this.status === PaymentStatus.REJECTED;
  }

  public isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  public canBeApproved(): boolean {
    return this.isPending();
  }

  public canBeRejected(): boolean {
    return this.isPending();
  }

  public canBeRefunded(): boolean {
    return this.isApproved();
  }

  public approve(transactionId?: string): Payment {
    if (!this.canBeApproved()) {
      throw new Error('Payment cannot be approved');
    }

    return new Payment(
      this.id,
      this.ticketId,
      this.userId,
      this.amount,
      this.method,
      PaymentStatus.APPROVED,
      this.pixCode,
      this.pixQrCode,
      this.installments,
      transactionId || this.transactionId,
      this.createdAt,
      new Date(),
      this.refundedAt,
    );
  }

  public reject(): Payment {
    if (!this.canBeRejected()) {
      throw new Error('Payment cannot be rejected');
    }

    return new Payment(
      this.id,
      this.ticketId,
      this.userId,
      this.amount,
      this.method,
      PaymentStatus.REJECTED,
      this.pixCode,
      this.pixQrCode,
      this.installments,
      this.transactionId,
      this.createdAt,
      this.approvedAt,
      this.refundedAt,
    );
  }

  public refund(): Payment {
    if (!this.canBeRefunded()) {
      throw new Error('Payment cannot be refunded');
    }

    return new Payment(
      this.id,
      this.ticketId,
      this.userId,
      this.amount,
      this.method,
      PaymentStatus.REFUNDED,
      this.pixCode,
      this.pixQrCode,
      this.installments,
      this.transactionId,
      this.createdAt,
      this.approvedAt,
      new Date(),
    );
  }

  public belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  public isForTicket(ticketId: string): boolean {
    return this.ticketId === ticketId;
  }

  public isPix(): boolean {
    return this.method === PaymentMethod.PIX;
  }

  public isCreditCard(): boolean {
    return this.method === PaymentMethod.CREDIT_CARD;
  }
}
