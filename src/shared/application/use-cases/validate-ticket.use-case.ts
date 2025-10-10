import { Injectable, Inject } from '@nestjs/common';
import { Ticket } from '../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { ValidateTicketDto } from '../../presentation/dtos/validate-ticket.dto';
import { TicketNotFoundException } from '../../domain/exceptions/ticket-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';

export interface ValidateTicketResult {
  valid: boolean;
  ticket?: Ticket;
  message: string;
}

@Injectable()
export class ValidateTicketUseCase {
  constructor(
    @Inject('ITicketRepository')
    private readonly ticketRepository: ITicketRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(ticketId: string, qrCodeData: string): Promise<ValidateTicketResult> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando validação de ingresso', {
      ticketId,
      qrCodeData,
      timestamp: new Date().toISOString(),
    });

    try {
      // Buscar ingresso pelo ID
      const ticket = await this.ticketRepository.findById(ticketId);
      if (!ticket) {
        const duration = Date.now() - startTime;
        this.logger.warn('Ingresso não encontrado', {
          ticketId,
          qrCodeData,
          duration,
        });
        return { valid: false, message: 'Ingresso não encontrado' };
      }

      // Verificar se o QR Code corresponde
      if (ticket.qrCodeData !== qrCodeData) {
        const duration = Date.now() - startTime;
        this.logger.warn('QR Code não corresponde', {
          ticketId,
          qrCodeData,
          expectedQrCode: ticket.qrCodeData,
          duration,
        });
        return { valid: false, message: 'QR Code inválido' };
      }

      // Verificar se o ingresso pode ser usado
      if (!ticket.canBeUsed()) {
        let message = 'Ingresso inválido';
        
        if (ticket.isUsed()) {
          message = 'Ingresso já foi utilizado';
        } else if (ticket.isCancelled()) {
          message = 'Ingresso cancelado';
        } else if (new Date() < ticket.eventDate) {
          message = 'Evento ainda não começou';
        }

        const duration = Date.now() - startTime;
        this.logger.warn('Ingresso inválido', {
          ticketId: ticket.id,
          qrCodeData,
          status: ticket.status,
          eventDate: ticket.eventDate,
          currentDate: new Date(),
          message,
          duration,
        });

        return { valid: false, ticket, message };
      }

      const duration = Date.now() - startTime;
      this.logger.info('Ingresso validado com sucesso', {
        ticketId: ticket.id,
        qrCodeData,
        eventId: ticket.eventId,
        duration,
      });

      return { valid: true, ticket, message: 'Ingresso válido' };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao validar ingresso', {
        ticketId,
        qrCodeData,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
