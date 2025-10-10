import { Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/interfaces/payment-repository.interface';
import { PaymentStatus } from '../../domain/value-objects/payment-status.enum';
import { PaymentMethod } from '../../domain/value-objects/payment-method.enum';

@Injectable()
export class PaymentInMemoryRepository implements IPaymentRepository {
  private payments: Payment[] = [
    new Payment(
      '1',
      '1',
      '2',
      150.00,
      PaymentMethod.PIX,
      PaymentStatus.APPROVED,
      '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540150.005802BR5913Joao Silva6009Sao Paulo62070503***6304',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      undefined,
      'TXN_1',
      new Date(),
      new Date(),
    ),
  ];

  async save(payment: Payment): Promise<Payment> {
    this.payments.push(payment);
    return payment;
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.find(payment => payment.id === id) || null;
  }

  async findAll(): Promise<Payment[]> {
    return [...this.payments];
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.payments.filter(payment => payment.userId === userId);
  }

  async findByTicketId(ticketId: string): Promise<Payment[]> {
    return this.payments.filter(payment => payment.ticketId === ticketId);
  }

  async update(id: string, updatedPayment: Payment): Promise<Payment | null> {
    const index = this.payments.findIndex(payment => payment.id === id);
    if (index === -1) return null;

    this.payments[index] = updatedPayment;
    return updatedPayment;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.payments.findIndex(payment => payment.id === id);
    if (index === -1) return false;

    this.payments.splice(index, 1);
    return true;
  }
}
