import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, HttpCode, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreatePaymentUseCase } from '../shared/application/use-cases/create-payment.use-case';
import { CreatePaymentDto } from '../shared/presentation/dtos/create-payment.dto';
import { ProcessPaymentDto } from '../shared/presentation/dtos/process-payment.dto';
import { PaymentResponseDto } from '../shared/presentation/dtos/payment-response.dto';
import { IPaymentRepository } from '../shared/domain/interfaces/payment-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { Payment } from '../shared/domain/entities/payment.entity';
import { PaymentStatus } from '../shared/domain/value-objects/payment-status.enum';

@ApiTags('Pagamentos')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos obtida com sucesso' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por usuário' })
  @ApiQuery({ name: 'ticketId', required: false, description: 'Filtrar por ingresso' })
  async findAll(@Query('userId') userId?: string, @Query('ticketId') ticketId?: string): Promise<PaymentResponseDto[]> {
    let payments: Payment[];
    
    if (userId) {
      payments = await this.paymentRepository.findByUserId(userId);
    } else if (ticketId) {
      payments = await this.paymentRepository.findByTicketId(ticketId);
    } else {
      payments = await this.paymentRepository.findAll();
    }
    
    return payments.map(payment => PaymentResponseDto.fromEntity(payment));
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de pagamentos' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  async getStats(): Promise<{ total: number; approved: number; pending: number; rejected: number; refunded: number }> {
    const payments = await this.paymentRepository.findAll();
    
    return {
      total: payments.length,
      approved: payments.filter(p => p.status === PaymentStatus.APPROVED).length,
      pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
      rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length,
      refunded: payments.filter(p => p.status === PaymentStatus.REFUNDED).length,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter pagamento por ID' })
  @ApiResponse({ status: 200, description: 'Pagamento obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return PaymentResponseDto.fromEntity(payment);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar status do pagamento' })
  @ApiResponse({ status: 200, description: 'Status do pagamento obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  async getStatus(@Param('id') id: string): Promise<any> {
    // Simular verificação de status
    return {
      paymentId: id,
      status: 'approved',
      amount: 300.00,
      approvedAt: new Date().toISOString(),
      tickets: [
        {
          id: `ticket-${Date.now()}-1`,
          code: 'ABC123456',
          categoryName: 'Pista',
          price: 150.00
        },
        {
          id: `ticket-${Date.now()}-2`,
          code: 'ABC123457',
          categoryName: 'Pista',
          price: 150.00
        }
      ]
    };
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Request() req: any): Promise<PaymentResponseDto> {
    const payment = await this.createPaymentUseCase.execute(createPaymentDto, req.user.id);
    return PaymentResponseDto.fromEntity(payment);
  }

  @Post('process')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Processar pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento processado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async process(@Body() processPaymentDto: ProcessPaymentDto, @Request() req: any): Promise<any> {
    console.log('🔍 Processando pagamento - Token recebido:', req.headers?.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'Token não encontrado');
    console.log('🔍 Usuário autenticado:', req.user);
    
    // Simular processamento de pagamento
    const paymentId = `payment-${Date.now()}`;
    const totalAmount = processPaymentDto.tickets.reduce((sum, ticket) => sum + (ticket.quantity * 150), 0);
    
    this.logger.info('Processando pagamento', {
      paymentId,
      userId: req.user.id,
      eventId: processPaymentDto.eventId,
      amount: totalAmount,
      tickets: processPaymentDto.tickets.length
    });

    // Simular resposta do gateway
    return {
      paymentId,
      status: 'processing',
      amount: totalAmount,
      gatewayResponse: {
        transactionId: `gateway-tx-${Date.now()}`,
        status: 'pending'
      }
    };
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprovar pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento aprovado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async approve(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    payment.approve();
    const updatedPayment = await this.paymentRepository.update(id, payment);
    return PaymentResponseDto.fromEntity(updatedPayment!);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeitar pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento rejeitado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async reject(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    payment.reject();
    const updatedPayment = await this.paymentRepository.update(id, payment);
    return PaymentResponseDto.fromEntity(updatedPayment!);
  }

  @Put(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reembolsar pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento reembolsado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async refund(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    payment.refund();
    const updatedPayment = await this.paymentRepository.update(id, payment);
    return PaymentResponseDto.fromEntity(updatedPayment!);
  }
}
