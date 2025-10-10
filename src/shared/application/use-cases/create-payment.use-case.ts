import { Injectable, Inject } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/interfaces/payment-repository.interface';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { CreatePaymentDto } from '../../presentation/dtos/create-payment.dto';
import { TicketNotFoundException } from '../../domain/exceptions/ticket-not-found.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';
import { PaymentStatus } from '../../domain/value-objects/payment-status.enum';
import { PaymentMethod } from '../../domain/value-objects/payment-method.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(createPaymentDto: CreatePaymentDto, userId: string): Promise<Payment> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando criação de pagamento', {
      ticketId: createPaymentDto.ticketId,
      method: createPaymentDto.method,
      amount: createPaymentDto.amount,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Verificar se o ingresso existe
      const ticket = await this.ticketRepository.findById(createPaymentDto.ticketId);
      if (!ticket) {
        throw new TicketNotFoundException(createPaymentDto.ticketId);
      }

      // Verificar se o ingresso pertence ao usuário
      if (!ticket.belongsTo(userId)) {
        throw new InvalidOperationException(
          'Create payment',
          'Ticket does not belong to this user'
        );
      }

      // Verificar se o valor do pagamento corresponde ao valor do ingresso
      if (createPaymentDto.amount !== ticket.price) {
        throw new InvalidOperationException(
          'Create payment',
          'Payment amount does not match ticket price'
        );
      }

      // Verificar se já existe um pagamento para este ingresso
      const existingPayment = await this.paymentRepository.findByTicketId(createPaymentDto.ticketId);
      if (existingPayment) {
        throw new InvalidOperationException(
          'Create payment',
          'Payment already exists for this ticket'
        );
      }

      // Criar pagamento
      let payment = new Payment(
        uuidv4(),
        createPaymentDto.ticketId,
        userId,
        createPaymentDto.amount,
        createPaymentDto.method,
        PaymentStatus.PENDING,
        undefined,
        undefined,
        createPaymentDto.installments,
        undefined,
        new Date(),
      );

      // Gerar dados específicos do método de pagamento
      if (createPaymentDto.method === PaymentMethod.PIX) {
        const pixCode = this.generatePixCode(createPaymentDto.amount, user.name, user.email);
        const pixQrCode = await this.generatePixQrCode(pixCode);
        
        payment = new Payment(
          payment.id,
          payment.ticketId,
          payment.userId,
          payment.amount,
          payment.method,
          payment.status,
          pixCode,
          pixQrCode,
          payment.installments,
          payment.transactionId,
          payment.createdAt,
        );
      }

      // Salvar pagamento
      const savedPayment = await this.paymentRepository.save(payment);

      const duration = Date.now() - startTime;
      this.logger.info('Pagamento criado com sucesso', {
        paymentId: savedPayment.id,
        ticketId: createPaymentDto.ticketId,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        userId,
        duration,
      });

      return savedPayment;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar pagamento', {
        ticketId: createPaymentDto.ticketId,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }

  private generatePixCode(amount: number, userName: string, userEmail: string): string {
    const randomCode = Math.random().toString(36).substring(2, 15);
    return `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${amount.toFixed(2)}5802BR5913${userName}6009Sao Paulo62070503***6304${randomCode}`;
  }

  private async generatePixQrCode(pixCode: string): Promise<string> {
    // Simular geração de QR Code para PIX
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}
