import { Injectable, Inject } from '@nestjs/common';
import { Ticket } from '../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { IEventRepository } from '../../domain/interfaces/event-repository.interface';
import { ITicketCategoryRepository } from '../../domain/interfaces/ticket-category-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { CreateTicketDto } from '../../presentation/dtos/create-ticket.dto';
import { EventNotFoundException } from '../../domain/exceptions/event-not-found.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';
import { TicketStatus } from '../../domain/value-objects/ticket-status.enum';
import { DocumentType } from '../../domain/value-objects/document-type.enum';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

@Injectable()
export class PurchaseTicketUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ITicketCategoryRepository')
    private readonly ticketCategoryRepository: ITicketCategoryRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Executa a compra de ingressos
   * 
   * Fluxo de execução (simulando pagamento aprovado):
   * 1. Validações: usuário, evento, categoria e disponibilidade
   * 2. Criação dos tickets com dados de identificação (nome, sobrenome, documento)
   * 3. Geração de QR codes para cada ticket
   * 4. Salvamento dos tickets no banco
   * 5. Atualização do evento (ingressos vendidos)
   * 6. Atualização da categoria (ingressos vendidos)
   * 
   * Nota: O pagamento é considerado aprovado neste use case.
   * A integração real com gateway de pagamento será implementada posteriormente.
   */
  async execute(createTicketDto: CreateTicketDto, userId: string): Promise<Ticket[]> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando compra de ingresso', {
      eventId: createTicketDto.eventId,
      categoryId: createTicketDto.categoryId,
      quantity: createTicketDto.quantity,
      userId,
      hasParticipants: !!(createTicketDto.participants && createTicketDto.participants.length > 0),
      participantsCount: createTicketDto.participants?.length || 0,
      paymentMethod: createTicketDto.paymentMethod || 'não especificado',
      hasHolderInfo: !!(createTicketDto.holderFirstName && createTicketDto.holderLastName),
      timestamp: new Date().toISOString(),
    });

    try {
      // ============================================
      // ETAPA 1: VALIDAÇÕES
      // ============================================
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Verificar se o evento existe
      const event = await this.eventRepository.findById(createTicketDto.eventId);
      if (!event) {
        throw new EventNotFoundException(createTicketDto.eventId);
      }

      // Verificar se o evento pode vender ingressos
      if (!event.canSellTickets()) {
        throw new InvalidOperationException(
          'Purchase tickets',
          'Event is not active or sold out'
        );
      }

      // Verificar se a categoria existe
      const category = await this.ticketCategoryRepository.findById(createTicketDto.categoryId);
      if (!category) {
        throw new InvalidOperationException(
          'Purchase tickets',
          'Ticket category not found'
        );
      }

      // Verificar se a categoria pertence ao evento
      if (!category.belongsToEvent(createTicketDto.eventId)) {
        throw new InvalidOperationException(
          'Purchase tickets',
          'Ticket category does not belong to this event'
        );
      }

      // Verificar se pode vender a quantidade solicitada
      if (!category.canSell(createTicketDto.quantity)) {
        throw new InvalidOperationException(
          'Purchase tickets',
          'Not enough tickets available in this category'
        );
      }

      // ============================================
      // ETAPA 2: CRIAÇÃO DOS TICKETS
      // Pagamento considerado aprovado (simulação)
      // ============================================
      // Ordem de execução: 1. Validações → 2. Criação dos tickets → 3. Salvamento → 4. Atualização evento/categoria
      const tickets: Ticket[] = [];
      
      // Validar quantidade de participantes se fornecido
      if (createTicketDto.participants && createTicketDto.participants.length !== createTicketDto.quantity) {
        throw new InvalidOperationException(
          'Purchase tickets',
          `Number of participants (${createTicketDto.participants.length}) must match quantity (${createTicketDto.quantity})`
        );
      }

      for (let i = 0; i < createTicketDto.quantity; i++) {
        const qrCodeData = `TICKET_${uuidv4()}_${event.date.toISOString()}_${userId}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);

        // Priorizar dados do participante no array, caso contrário usar campos legados ou dados do usuário
        const participant = createTicketDto.participants?.[i];
        const holderFirstName = participant?.firstName || createTicketDto.holderFirstName || user.name?.split(' ')[0] || null;
        const holderLastName = participant?.lastName || createTicketDto.holderLastName || user.name?.split(' ').slice(1).join(' ') || null;
        
        // Extrair tipo de documento do formato do documento (CPF, CNPJ, etc)
        let documentType = createTicketDto.documentType;
        let documentNumber = participant?.document || createTicketDto.documentNumber || null;
        
        // Se temos documento mas não tipo, tentar inferir do formato
        if (documentNumber && !documentType) {
          // Remove formatação para análise
          const cleanDoc = documentNumber.replace(/[.\-/]/g, '');
          if (cleanDoc.length === 11) {
            documentType = DocumentType.CPF;
          } else if (cleanDoc.length === 14) {
            // CNPJ tem 14 dígitos, usar OUTRO já que não temos CNPJ no enum
            documentType = DocumentType.OUTRO;
          }
        }

        // Usar email do participante se disponível, senão usar email do usuário
        const ticketEmail = participant?.email || user.email;

        const ticket = Ticket.create(
          createTicketDto.eventId,
          userId,
          createTicketDto.categoryId,
          event.title,
          event.date,
          event.location,
          category.name,
          user.name,
          ticketEmail,
          category.price,
          qrCodeImage,
          qrCodeData,
          holderFirstName,
          holderLastName,
          documentType || null,
          documentNumber,
        );

        tickets.push(ticket);
      }

      // ============================================
      // ETAPA 3: SALVAMENTO DOS TICKETS
      // ============================================
      const savedTickets: Ticket[] = [];
      for (const ticket of tickets) {
        const savedTicket = await this.ticketRepository.save(ticket);
        savedTickets.push(savedTicket);
      }

      // ============================================
      // ETAPA 4: ATUALIZAÇÃO DO EVENTO E CATEGORIA
      // ============================================
      event.addSoldTickets(createTicketDto.quantity);
      await this.eventRepository.update(createTicketDto.eventId, event);

      category.sell(createTicketDto.quantity);
      await this.ticketCategoryRepository.update(createTicketDto.categoryId, category);

      const duration = Date.now() - startTime;
      this.logger.info('Ingressos comprados com sucesso', {
        eventId: createTicketDto.eventId,
        categoryId: createTicketDto.categoryId,
        quantity: createTicketDto.quantity,
        userId,
        ticketIds: savedTickets.map(t => t.id),
        duration,
      });

      return savedTickets;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao comprar ingressos', {
        eventId: createTicketDto.eventId,
        categoryId: createTicketDto.categoryId,
        quantity: createTicketDto.quantity,
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
