import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Payment {
  id: string;
  ticketId: string;
  userId: string;
  amount: number;
  method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  pixCode?: string;
  pixQrCode?: string;
  installments?: number;
  transactionId?: string;
  createdAt: Date;
  approvedAt?: Date;
  refundedAt?: Date;
}

@Injectable()
export class PaymentsService {
  private payments: Payment[] = [
    {
      id: '1',
      ticketId: '1',
      userId: '2',
      amount: 150.00,
      method: 'PIX',
      status: 'APPROVED',
      pixCode: '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540150.005802BR5913Joao Silva6009Sao Paulo62070503***6304',
      pixQrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      createdAt: new Date(),
      approvedAt: new Date(),
    },
  ];

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment: Payment = {
      id: uuidv4(),
      ticketId: paymentData.ticketId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'PENDING',
      installments: paymentData.installments,
      createdAt: new Date(),
    };

    // Simular geração de PIX
    if (payment.method === 'PIX') {
      payment.pixCode = this.generatePixCode(payment.amount);
      payment.pixQrCode = await this.generatePixQrCode(payment.pixCode);
    }

    this.payments.push(payment);
    return payment;
  }

  async findAll(): Promise<Payment[]> {
    return this.payments;
  }

  async findById(id: string): Promise<Payment | undefined> {
    return this.payments.find(payment => payment.id === id);
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.payments.filter(payment => payment.userId === userId);
  }

  async findByTicketId(ticketId: string): Promise<Payment | undefined> {
    return this.payments.find(payment => payment.ticketId === ticketId);
  }

  async approvePayment(id: string): Promise<Payment | undefined> {
    const payment = this.payments.find(p => p.id === id);
    if (!payment || payment.status !== 'PENDING') {
      return undefined;
    }

    payment.status = 'APPROVED';
    payment.approvedAt = new Date();
    payment.transactionId = `TXN_${uuidv4()}`;
    return payment;
  }

  async rejectPayment(id: string): Promise<Payment | undefined> {
    const payment = this.payments.find(p => p.id === id);
    if (!payment || payment.status !== 'PENDING') {
      return undefined;
    }

    payment.status = 'REJECTED';
    return payment;
  }

  async refundPayment(id: string): Promise<Payment | undefined> {
    const payment = this.payments.find(p => p.id === id);
    if (!payment || payment.status !== 'APPROVED') {
      return undefined;
    }

    payment.status = 'REFUNDED';
    payment.refundedAt = new Date();
    return payment;
  }

  private generatePixCode(amount: number): string {
    const randomCode = Math.random().toString(36).substring(2, 15);
    return `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${amount.toFixed(2)}5802BR5913Gwan Shop6009Sao Paulo62070503***6304${randomCode}`;
  }

  private async generatePixQrCode(pixCode: string): Promise<string> {
    // Simular geração de QR Code para PIX
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }

  async getPaymentStats(): Promise<{ total: number; pending: number; approved: number; rejected: number; refunded: number; totalAmount: number }> {
    return {
      total: this.payments.length,
      pending: this.payments.filter(p => p.status === 'PENDING').length,
      approved: this.payments.filter(p => p.status === 'APPROVED').length,
      rejected: this.payments.filter(p => p.status === 'REJECTED').length,
      refunded: this.payments.filter(p => p.status === 'REFUNDED').length,
      totalAmount: this.payments
        .filter(p => p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.amount, 0),
    };
  }
}
