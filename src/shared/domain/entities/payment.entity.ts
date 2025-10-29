import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Ticket } from './ticket.entity';
import { PaymentStatus } from '../value-objects/payment-status.enum';
import { PaymentMethod } from '../value-objects/payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  pixCode: string;

  @Column({ type: 'text', nullable: true })
  qrCodeImage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalTransactionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  // Métodos estáticos
  public static create(
    userId: string,
    ticketId: string,
    amount: number,
    method: PaymentMethod,
    pixCode?: string,
    qrCodeImage?: string,
    transactionId?: string,
    externalTransactionId?: string,
  ): Payment {
    const payment = new Payment();
    payment.userId = userId;
    payment.ticketId = ticketId;
    payment.amount = amount;
    payment.method = method;
    payment.status = PaymentStatus.PENDING;
    payment.pixCode = pixCode;
    payment.qrCodeImage = qrCodeImage;
    payment.transactionId = transactionId;
    payment.externalTransactionId = externalTransactionId;
    payment.createdAt = new Date();
    payment.updatedAt = new Date();
    return payment;
  }

  // Métodos de domínio
  public approve(): Payment {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Payment cannot be approved');
    }
    this.status = PaymentStatus.APPROVED;
    return this;
  }

  public reject(): Payment {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Payment cannot be rejected');
    }
    this.status = PaymentStatus.REJECTED;
    return this;
  }

  public refund(): Payment {
    if (this.status !== PaymentStatus.APPROVED) {
      throw new Error('Payment cannot be refunded');
    }
    this.status = PaymentStatus.REFUNDED;
    return this;
  }
}