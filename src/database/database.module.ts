import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../shared/domain/entities/user.entity';
import { Event } from '../shared/domain/entities/event.entity';
import { TicketCategory } from '../shared/domain/entities/ticket-category.entity';
import { Ticket } from '../shared/domain/entities/ticket.entity';
import { Payment } from '../shared/domain/entities/payment.entity';
import { Scanner } from '../shared/domain/entities/scanner.entity';
import { DatabaseSeeder } from './seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, TicketCategory, Ticket, Payment, Scanner]),
  ],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class DatabaseModule {}
