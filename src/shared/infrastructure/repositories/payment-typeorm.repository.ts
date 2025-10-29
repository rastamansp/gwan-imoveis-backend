import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/interfaces/payment-repository.interface';

@Injectable()
export class PaymentTypeOrmRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    return await this.paymentRepository.save(payment);
  }

  async findById(id: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find();
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({ where: { userId } });
  }

  async findByTicketId(ticketId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({ where: { ticketId } });
  }

  async update(id: string, updatedPayment: Payment): Promise<Payment | null> {
    await this.paymentRepository.update(id, updatedPayment);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.paymentRepository.delete(id);
    return result.affected > 0;
  }
}
