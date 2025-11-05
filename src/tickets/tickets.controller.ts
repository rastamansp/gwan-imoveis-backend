import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request, HttpCode, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiExtension, ApiParam } from '@nestjs/swagger';
import { PurchaseTicketUseCase } from '../shared/application/use-cases/purchase-ticket.use-case';
import { ValidateTicketUseCase } from '../shared/application/use-cases/validate-ticket.use-case';
import { GetUserTicketsByEventUseCase } from '../shared/application/use-cases/get-user-tickets-by-event.use-case';
import { CreateTicketDto } from '../shared/presentation/dtos/create-ticket.dto';
import { ValidateTicketDto } from '../shared/presentation/dtos/validate-ticket.dto';
import { TransferTicketDto } from '../shared/presentation/dtos/transfer-ticket.dto';
import { TicketResponseDto } from '../shared/presentation/dtos/ticket-response.dto';
import { TicketQRCodeResponseDto } from '../shared/presentation/dtos/ticket-qrcode-response.dto';
import { ITicketRepository } from '../shared/domain/interfaces/ticket-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { IQRCodeService } from '../shared/application/interfaces/qrcode.interface';
import { Ticket } from '../shared/domain/entities/ticket.entity';
import { TicketStatus } from '../shared/domain/value-objects/ticket-status.enum';

@ApiTags('Ingressos')
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly purchaseTicketUseCase: PurchaseTicketUseCase,
    private readonly validateTicketUseCase: ValidateTicketUseCase,
    private readonly getUserTicketsByEventUseCase: GetUserTicketsByEventUseCase,
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject('IQRCodeService')
    private readonly qrCodeService: IQRCodeService,
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
  async getStats(): Promise<any> {
    const tickets = await this.ticketRepository.findAll();
    
    return {
      total: tickets.length,
      active: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
      used: tickets.filter(t => t.status === TicketStatus.USED).length,
      cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
    };
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter ingressos do usuário logado' })
  @ApiResponse({ status: 200, description: 'Ingressos do usuário obtidos com sucesso' })
  async getMyTickets(@Request() req: any): Promise<{ tickets: any[] }> {
    const startTime = Date.now();
    const userId = req.user.id;

    this.logger.info('Carregando ingressos do usuário', { userId });

    try {
      const tickets = await this.ticketRepository.findByUserId(userId);
      
      // Gerar QR Codes para os ingressos
      const ticketsWithQR = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
            // Usar qrCodeData (formato TICKET_...) ao invés de qrCode (base64) para URL menor
            const codeForValidation = ticket.qrCodeData || ticket.qrCode || ticket.id;
            const validationUrl = `${apiBaseUrl}/api/tickets/validate?code=${encodeURIComponent(codeForValidation)}&apiKey=org_${ticket.eventId.slice(0, 8)}`;
            
            const qrCodeBase64 = await this.qrCodeService.generateQRCode(validationUrl);
            
            return {
              ...TicketResponseDto.fromEntity(ticket),
              qrCode: qrCodeBase64,
              qrCodeUrl: validationUrl,
            };
          } catch (qrError) {
            this.logger.warn('Falha ao gerar QR Code para ingresso', { 
              ticketId: ticket.id,
              error: qrError.message 
            });
            
            return TicketResponseDto.fromEntity(ticket);
          }
        })
      );

      const duration = Date.now() - startTime;
      this.logger.info('Ingressos carregados com sucesso', { 
        userId, 
        ticketCount: ticketsWithQR.length,
        duration 
      });

      return { tickets: ticketsWithQR };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao carregar ingressos do usuário', {
        userId,
        error: error.message,
        duration
      });
      throw error;
    }
  }

  @Get('my-tickets/:eventId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter ingressos do usuário logado para um evento específico' })
  @ApiResponse({ status: 200, description: 'Ingressos do usuário obtidos com sucesso' })
  @ApiParam({ name: 'eventId', description: 'ID do evento (UUID)' })
  @ApiExtension('x-mcp', {
    enabled: true,
    toolName: 'get_user_tickets_by_event',
    description: 'Obtém ingressos do usuário para um evento específico. O userId será obtido do contexto.',
    parameters: {
      eventId: { type: 'string', description: 'ID do evento (UUID)' },
      userId: { type: 'string', description: 'ID do usuário (UUID) - obtido do contexto do WhatsApp' },
    },
  })
  async getMyTicketsByEvent(@Param('eventId') eventId: string, @Request() req: any, @Query('userId') userIdQuery?: string): Promise<{ tickets: any[]; event: any }> {
    const startTime = Date.now();
    // Usar userId do query se disponível (via MCP), caso contrário usar do JWT
    const userId = userIdQuery || req.user?.id;

    this.logger.info('Carregando ingressos do usuário para evento específico', { userId, eventId });

    try {
      const result = await this.getUserTicketsByEventUseCase.execute(userId, eventId);
      
      // Não gerar QR codes base64 aqui para evitar payloads grandes
      // QR codes serão gerados dinamicamente no WhatsAppFormatterService quando necessário
      // Para APIs REST, usar endpoint /api/tickets/:id/qrcode se necessário
      const ticketsWithUrl = result.tickets.map((ticket) => {
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
        const codeForValidation = ticket.qrCodeData || ticket.qrCode || ticket.id;
        const validationUrl = `${apiBaseUrl}/api/tickets/validate?code=${encodeURIComponent(codeForValidation)}&apiKey=org_${ticket.eventId.slice(0, 8)}`;
        
        return {
          ...TicketResponseDto.fromEntity(ticket),
          // Não incluir qrCode base64 (muito grande ~5-10KB por ticket)
          // QR code pode ser obtido via endpoint /api/tickets/:id/qrcode se necessário
          qrCodeUrl: validationUrl,
        };
      });

      const duration = Date.now() - startTime;
      this.logger.info('Ingressos do usuário para evento carregados com sucesso', { 
        userId, 
        eventId,
        ticketCount: ticketsWithUrl.length,
        duration 
      });

      return { 
        tickets: ticketsWithUrl,
        event: {
          id: result.event.id,
          title: result.event.title,
          date: result.event.date,
          location: result.event.location,
          address: result.event.address,
          city: result.event.city,
          state: result.event.state,
        },
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao carregar ingressos do usuário para evento', {
        userId,
        eventId,
        error: error.message,
        duration
      });
      throw error;
    }
  }

  @Get(':id/qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar QR Code para ingresso' })
  @ApiResponse({ status: 200, description: 'QR Code gerado com sucesso' })
  async generateQRCode(@Param('id') id: string, @Request() req: any): Promise<TicketQRCodeResponseDto> {
    const startTime = Date.now();
    const userId = req.user.id;

    this.logger.info('Iniciando geração de QR Code para ingresso', { 
      ticketId: id, 
      userId,
      timestamp: new Date().toISOString()
    });

    try {
      const ticket = await this.ticketRepository.findById(id);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.userId !== userId) {
        throw new Error('User does not own this ticket');
      }

      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
      // Usar qrCodeData (formato TICKET_...) ao invés de qrCode (base64) para URL menor
      const codeForValidation = ticket.qrCodeData || ticket.qrCode || ticket.id;
      const validationUrl = `${apiBaseUrl}/api/tickets/validate?code=${encodeURIComponent(codeForValidation)}&apiKey=org_${ticket.eventId.slice(0, 8)}`;
      
      const qrCodeBase64 = await this.qrCodeService.generateQRCode(validationUrl);

      const duration = Date.now() - startTime;
      this.logger.info('QR Code gerado com sucesso', {
        ticketId: id,
        ticketCode: codeForValidation,
        validationUrl,
        qrCodeSize: qrCodeBase64.length,
        duration
      });

      return TicketQRCodeResponseDto.create(
        qrCodeBase64,
        validationUrl,
        codeForValidation,
        ticket.id
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao gerar QR Code', {
        ticketId: id,
        userId,
        error: error.message,
        duration
      });
      throw error;
    }
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validar ingresso por app mobile' })
  @ApiResponse({ status: 200, description: 'Ingresso validado com sucesso' })
  @ApiQuery({ name: 'code', required: true, description: 'Código do ingresso' })
  @ApiQuery({ name: 'apiKey', required: true, description: 'API Key do organizador' })
  async validateByCode(
    @Query('code') code: string,
    @Query('apiKey') apiKey: string,
  ): Promise<{ valid: boolean; message: string; ticket?: any }> {
    const startTime = Date.now();

    this.logger.info('Iniciando validação de ingresso por app mobile', {
      code,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined',
      timestamp: new Date().toISOString()
    });

    try {
      // Validar API Key básica
      if (!apiKey || !apiKey.startsWith('org_')) {
        this.logger.warn('API Key inválida', {
          apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined',
          code
        });
        return {
          valid: false,
          message: 'API Key inválida'
        };
      }

      // Buscar ingresso pelo código QR (tentar primeiro qrCodeData, depois qrCode)
      let ticket = await this.ticketRepository.findByQrCodeData(code);
      if (!ticket) {
        ticket = await this.ticketRepository.findByQrCode(code);
      }
      
      if (!ticket) {
        this.logger.warn('Ingresso não encontrado', {
          code,
          apiKey: apiKey.substring(0, 8) + '...'
        });
        return {
          valid: false,
          message: 'Ingresso não encontrado'
        };
      }

      // Validar status do ingresso
      if (ticket.status !== TicketStatus.ACTIVE) {
        this.logger.warn('Ingresso inválido', {
          ticketId: ticket.id,
          status: ticket.status,
          code
        });
        return {
          valid: false,
          message: `Ingresso ${ticket.status.toLowerCase()}`
        };
      }

      // Validar se o evento ainda está ativo (opcional)
      // Aqui você pode adicionar validações adicionais se necessário

      const duration = Date.now() - startTime;
      this.logger.info('Ingresso validado com sucesso', {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        userId: ticket.userId,
        code,
        duration
      });

      return {
        valid: true,
        message: 'Ingresso válido',
        ticket: {
          id: ticket.id,
          eventId: ticket.eventId,
          userId: ticket.userId,
          status: ticket.status,
          purchasedAt: ticket.purchasedAt
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao validar ingresso', {
        code,
        error: error.message,
        duration
      });
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ 
    summary: 'Comprar ingresso', 
    description: 'Realiza a compra de ingressos para um evento. Pode incluir dados de identificação do titular (nome, sobrenome, tipo e número de documento). O pagamento é considerado aprovado (simulação). Retorna array de tickets criados.' 
  })
  @ApiResponse({ status: 201, description: 'Ingresso comprado com sucesso', type: [TicketResponseDto] })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou evento/categoria não disponível' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createTicketDto: CreateTicketDto, @Request() req: any): Promise<TicketResponseDto[]> {
    const tickets = await this.purchaseTicketUseCase.execute(createTicketDto, req.user.id);
    return tickets.map(ticket => TicketResponseDto.fromEntity(ticket));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter ingresso por ID' })
  @ApiResponse({ status: 200, description: 'Ingresso obtido com sucesso' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.userId !== req.user.id) {
      throw new Error('User does not own this ticket');
    }

    return TicketResponseDto.fromEntity(ticket);
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validar ingresso' })
  @ApiResponse({ status: 200, description: 'Ingresso validado com sucesso' })
  async validate(@Param('id') id: string, @Body() validateTicketDto: ValidateTicketDto): Promise<any> {
    const result = await this.validateTicketUseCase.execute(id, validateTicketDto.qrCodeData);
    return result;
  }

  @Put(':id/use')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar ingresso como usado' })
  @ApiResponse({ status: 200, description: 'Ingresso marcado como usado' })
  async useTicket(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.markAsUsed();
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket);
  }

  @Put(':id/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transferir ingresso' })
  @ApiResponse({ status: 200, description: 'Ingresso transferido com sucesso' })
  async transferTicket(@Param('id') id: string, @Body() transferTicketDto: TransferTicketDto): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.markAsTransferred(transferTicketDto.newUserId, transferTicketDto.newUserName, transferTicketDto.newUserEmail);
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar ingresso' })
  @ApiResponse({ status: 200, description: 'Ingresso cancelado com sucesso' })
  async cancelTicket(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketRepository.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.markAsCancelled();
    const updatedTicket = await this.ticketRepository.update(id, ticket);
    return TicketResponseDto.fromEntity(updatedTicket);
  }
}