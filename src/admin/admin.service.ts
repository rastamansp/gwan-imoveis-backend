import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { IEventRepository } from '../shared/domain/interfaces/event-repository.interface';
import { ITicketRepository } from '../shared/domain/interfaces/ticket-repository.interface';
import { IPaymentRepository } from '../shared/domain/interfaces/payment-repository.interface';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';
import { EventStatus } from '../shared/domain/value-objects/event-status.enum';
import { TicketStatus } from '../shared/domain/value-objects/ticket-status.enum';
import { PaymentStatus } from '../shared/domain/value-objects/payment-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async getDashboardStats() {
    const users = await this.userRepository.findAll();
    const events = await this.eventRepository.findAll();
    const tickets = await this.ticketRepository.findAll();
    const payments = await this.paymentRepository.findAll();

    return {
      users: {
        total: users.length,
        organizers: users.filter(u => u.role === UserRole.ORGANIZER).length,
        customers: users.filter(u => u.role === UserRole.USER).length,
      },
      events: {
        total: events.length,
        active: events.filter(e => e.status === EventStatus.ACTIVE).length,
        soldOut: events.filter(e => e.status === EventStatus.SOLD_OUT).length,
        cancelled: events.filter(e => e.status === EventStatus.CANCELLED).length,
      },
      tickets: {
        total: tickets.length,
        active: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
        used: tickets.filter(t => t.status === TicketStatus.USED).length,
        cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
      },
      payments: {
        total: payments.length,
        approved: payments.filter(p => p.status === PaymentStatus.APPROVED).length,
        pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
        rejected: payments.filter(p => p.status === PaymentStatus.REJECTED).length,
        refunded: payments.filter(p => p.status === PaymentStatus.REFUNDED).length,
      },
      revenue: {
        total: payments
          .filter(p => p.status === PaymentStatus.APPROVED)
          .reduce((sum, p) => sum + p.amount, 0),
        thisMonth: this.calculateMonthlyRevenue(payments),
        growth: this.calculateGrowthRate(payments),
      },
    };
  }

  async getEventAnalytics(eventId: string) {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Evento não encontrado');
    }

    const tickets = await this.ticketRepository.findByEventId(eventId);
    const payments = await this.paymentRepository.findAll();
    const eventPayments = payments.filter(p => 
      tickets.some(t => t.id === p.ticketId)
    );

    return {
      event,
      tickets: {
        total: tickets.length,
        active: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
        used: tickets.filter(t => t.status === TicketStatus.USED).length,
        cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
      },
      revenue: {
        total: eventPayments
          .filter(p => p.status === PaymentStatus.APPROVED)
          .reduce((sum, p) => sum + p.amount, 0),
        byMethod: this.groupPaymentsByMethod(eventPayments),
      },
      attendance: {
        expected: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
        actual: tickets.filter(t => t.status === TicketStatus.USED).length,
        rate: tickets.filter(t => t.status === TicketStatus.ACTIVE).length > 0 
          ? (tickets.filter(t => t.status === TicketStatus.USED).length / tickets.filter(t => t.status === TicketStatus.ACTIVE).length) * 100
          : 0,
      },
    };
  }

  async getUserAnalytics(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const tickets = await this.ticketRepository.findByUserId(userId);
    const payments = await this.paymentRepository.findByUserId(userId);

    return {
      user,
      tickets: {
        total: tickets.length,
        active: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
        used: tickets.filter(t => t.status === TicketStatus.USED).length,
        cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED).length,
      },
      payments: {
        total: payments.length,
        approved: payments.filter(p => p.status === PaymentStatus.APPROVED).length,
        pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
        refunded: payments.filter(p => p.status === PaymentStatus.REFUNDED).length,
        totalAmount: payments
          .filter(p => p.status === PaymentStatus.APPROVED)
          .reduce((sum, p) => sum + p.amount, 0),
      },
      preferences: {
        categories: this.getUserCategoryPreferences(tickets),
        averageTicketPrice: tickets.length > 0 
          ? tickets.reduce((sum, t) => sum + t.price, 0) / tickets.length
          : 0,
      },
    };
  }

  private calculateMonthlyRevenue(payments: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return payments
      .filter(p => 
        p.status === PaymentStatus.APPROVED && 
        p.approvedAt &&
        new Date(p.approvedAt).getMonth() === currentMonth &&
        new Date(p.approvedAt).getFullYear() === currentYear
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }

  private calculateGrowthRate(payments: any[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentRevenue = this.calculateMonthlyRevenue(payments);
    const lastRevenue = payments
      .filter(p => 
        p.status === PaymentStatus.APPROVED && 
        p.approvedAt &&
        new Date(p.approvedAt).getMonth() === lastMonth &&
        new Date(p.approvedAt).getFullYear() === lastMonthYear
      )
      .reduce((sum, p) => sum + p.amount, 0);

    return lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  }

  private groupPaymentsByMethod(payments: any[]): any {
    const grouped = payments
      .filter(p => p.status === PaymentStatus.APPROVED)
      .reduce((acc, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
        return acc;
      }, {});

    return grouped;
  }

  private getUserCategoryPreferences(tickets: any[]): any {
    const eventIds = tickets.map(t => t.eventId);
    // Aqui seria necessário buscar os eventos para obter as categorias
    // Por simplicidade, retornamos um objeto vazio
    return {};
  }
}
