import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../../domain/entities/ticket.entity';
import { ITicketRepository } from '../../domain/interfaces/ticket-repository.interface';

@Injectable()
export class TicketTypeOrmRepository implements ITicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async save(ticket: Ticket): Promise<Ticket> {
    return await this.ticketRepository.save(ticket);
  }

  async findById(id: string): Promise<Ticket | null> {
    return await this.ticketRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find();
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({ where: { userId } });
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({ where: { eventId } });
  }

  async findByUserIdAndEventId(userId: string, eventId: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({ 
      where: { 
        userId,
        eventId,
      },
      order: {
        purchasedAt: 'DESC',
      },
    });
  }

  async findByQrCodeData(qrCodeData: string): Promise<Ticket | null> {
    return await this.ticketRepository.findOne({ where: { qrCodeData } });
  }

  async findByQrCode(qrCode: string): Promise<Ticket | null> {
    return await this.ticketRepository.findOne({ where: { qrCode } });
  }

  async update(id: string, updatedTicket: Ticket): Promise<Ticket | null> {
    await this.ticketRepository.update(id, updatedTicket);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ticketRepository.delete(id);
    return result.affected > 0;
  }
}
