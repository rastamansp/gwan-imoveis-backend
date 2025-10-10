import { Payment } from '../entities/payment.entity';

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  findByUserId(userId: string): Promise<Payment[]>;
  findByTicketId(ticketId: string): Promise<Payment[]>;
  update(id: string, payment: Payment): Promise<Payment | null>;
  delete(id: string): Promise<boolean>;
}
