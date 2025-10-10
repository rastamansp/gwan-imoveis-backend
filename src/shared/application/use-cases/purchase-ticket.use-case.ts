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

  async execute(createTicketDto: CreateTicketDto, userId: string): Promise<Ticket[]> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando compra de ingresso', {
      eventId: createTicketDto.eventId,
      categoryId: createTicketDto.categoryId,
      quantity: createTicketDto.quantity,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
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

      // Criar ingressos
      const tickets: Ticket[] = [];
      for (let i = 0; i < createTicketDto.quantity; i++) {
        const qrCodeData = `TICKET_${uuidv4()}_${event.date.toISOString()}_${userId}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);

        const ticket = new Ticket(
          uuidv4(),
          createTicketDto.eventId,
          event.title,
          event.date,
          event.location,
          createTicketDto.categoryId,
          category.name,
          userId,
          user.name,
          user.email,
          category.price,
          qrCodeImage,
          qrCodeData,
          TicketStatus.ACTIVE,
          new Date(),
        );

        tickets.push(ticket);
      }

      // Salvar ingressos
      const savedTickets: Ticket[] = [];
      for (const ticket of tickets) {
        const savedTicket = await this.ticketRepository.save(ticket);
        savedTickets.push(savedTicket);
      }

      // Atualizar evento com ingressos vendidos
      const updatedEvent = event.addSoldTickets(createTicketDto.quantity);
      await this.eventRepository.update(createTicketDto.eventId, updatedEvent);

      // Atualizar categoria com ingressos vendidos
      const updatedCategory = category.sell(createTicketDto.quantity);
      await this.ticketCategoryRepository.update(createTicketDto.categoryId, updatedCategory);

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
