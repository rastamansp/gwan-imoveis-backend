import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, HttpCode, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchaseTicketUseCase } from '../shared/application/use-cases/purchase-ticket.use-case';
import { ValidateTicketUseCase } from '../shared/application/use-cases/validate-ticket.use-case';
import { CreateTicketDto } from '../shared/presentation/dtos/create-ticket.dto';
import { ValidateTicketDto } from '../shared/presentation/dtos/validate-ticket.dto';
import { TransferTicketDto } from '../shared/presentation/dtos/transfer-ticket.dto';
import { TicketResponseDto } from '../shared/presentation/dtos/ticket-response.dto';
import { ITicketRepository } from '../shared/domain/interfaces/ticket-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { Ticket } from '../shared/domain/entities/ticket.entity';
import { TicketStatus } from '../shared/domain/value-objects/ticket-status.enum';

@ApiTags('Ingressos')
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly purchaseTicketUseCase: PurchaseTicketUseCase,
    private readonly validateTicketUseCase: ValidateTicketUseCase,
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os ingressos' })
  @ApiResponse({ status: 200, description: 'Lista de ingressos obtida com sucesso' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por usuário' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filtrar por evento' })
  async findAll(@Query('userId') userId?: string, @Query('eventId') eventId?: string): Promise<TicketResponseDto[]> {
    let tickets: Ticket[];
    
    if (userId) {
      tickets = await this.ticketRepository.findByUserId(userId);
    } else if (eventId) {
      tickets = await this.ticketRepository.findByEventId(eventId);
    } else {
      tickets = await this.ticketRepository.findAll();
    }
    
    return tickets.map(ticket => TicketResponseDto.fromEntity(ticket));
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de ingressos' })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filtrar por evento' })
  async getStats(@Query('eventId') eventId?: string): Promise<{ total: number; used: number; cancelled: number; pending: number }> {
    const tickets = eventId 
      ? await this.ticketRepository.findByEventId(eventId)
      : await this.ticketRepository.findAll();
    
    return {
      total: tickets.length,
      used: tickets.filter(t => t.status === TicketStatus.USED).length,
      cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
      pending: tickets.filter(t => t.status === TicketStatus.PENDING).length,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter ingresso por ID' })
  @ApiResponse({ status: 200, description: 'Ingresso obtido com sucesso' })
  @ApiResponse({ status: 404, description: 'Ingresso não encontrado' })
  async findOne(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    return TicketResponseDto.fromEntity(ticket);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comprar ingresso' })
  @ApiResponse({ status: 201, description: 'Ingresso comprado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createTicketDto: CreateTicketDto, @Request() req: any): Promise<TicketResponseDto> {
    const tickets = await this.purchaseTicketUseCase.execute(createTicketDto, req.user.id);
    return TicketResponseDto.fromEntity(tickets[0]);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter meus ingressos' })
  @ApiResponse({ status: 200, description: 'Ingressos do usuário obtidos com sucesso' })
  async getMyTickets(@Request() req: any): Promise<any> {
    // Simular resposta com ingressos do usuário
    return {
      tickets: [
        {
          id: `ticket-${Date.now()}-1`,
          code: 'ABC123456',
          event: {
            id: '1',
            title: 'Festival de Música Eletrônica',
            date: '2024-06-15T20:00:00Z',
            location: 'Parque da Cidade'
          },
          category: {
            name: 'Pista',
            price: 150.00
          },
          status: 'ACTIVE',
          purchasedAt: new Date().toISOString(),
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        }
      ]
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar ingresso por código' })
  @ApiResponse({ status: 200, description: 'Validação realizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Ingresso inválido' })
  async validateByCode(@Body() body: { ticketCode: string; scannerId: string; location: string }): Promise<any> {
    // Simular validação de ingresso
    return {
      valid: true,
      ticket: {
        id: `ticket-${Date.now()}`,
        code: body.ticketCode,
        eventTitle: 'Festival de Música Eletrônica',
        categoryName: 'Pista',
        holderName: 'João Silva',
        status: 'ACTIVE',
        checkInStatus: 'NOT_CHECKED_IN'
      },
      message: 'Ingresso válido para check-in'
    };
  }

  @Post('checkin')
  @ApiOperation({ summary: 'Fazer check-in do ingresso' })
  @ApiResponse({ status: 200, description: 'Check-in realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no check-in' })
  async checkIn(@Body() body: { ticketCode: string; scannerId: string; location: string; timestamp: string }): Promise<any> {
    // Simular check-in
    return {
      success: true,
      ticket: {
        id: `ticket-${Date.now()}`,
        code: body.ticketCode,
        checkInStatus: 'CHECKED_IN',
        checkedInAt: body.timestamp,
        checkedInBy: body.scannerId
      },
      message: 'Check-in realizado com sucesso'
    };
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validar ingresso por QR Code' })
  @ApiResponse({ status: 200, description: 'Validação realizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Ingresso inválido' })
  async validate(@Param('id') id: string, @Body() validateTicketDto: ValidateTicketDto): Promise<{ valid: boolean; message: string }> {
    const result = await this.validateTicketUseCase.execute(id, validateTicketDto.qrCodeData);
    return result;
  }

  @Put(':id/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar ingresso como usado' })
  @ApiResponse({ status: 200, description: 'Ingresso marcado como usado' })
  @ApiResponse({ status: 404, description: 'Ingresso não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async use(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    ticket.markAsUsed();
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket!);
  }

  @Put(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transferir ingresso para outro usuário' })
  @ApiResponse({ status: 200, description: 'Ingresso transferido com sucesso' })
  @ApiResponse({ status: 404, description: 'Ingresso não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async transfer(@Param('id') id: string, @Body() transferTicketDto: TransferTicketDto): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    ticket.markAsTransferred(transferTicketDto.newUserId, transferTicketDto.newUserName, transferTicketDto.newUserEmail);
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket!);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar ingresso' })
  @ApiResponse({ status: 200, description: 'Ingresso cancelado com sucesso' })
  @ApiResponse({ status: 404, description: 'Ingresso não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async cancel(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    ticket.markAsCancelled();
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket!);
  }
}
