import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { Event } from './domain/entities/event.entity';
import { Ticket } from './domain/entities/ticket.entity';
import { Payment } from './domain/entities/payment.entity';
import { TicketCategory } from './domain/entities/ticket-category.entity';
import { Scanner } from './domain/entities/scanner.entity';
import { ConsoleLoggerService } from './infrastructure/logger/console-logger.service';
import { UserTypeOrmRepository } from './infrastructure/repositories/user-typeorm.repository';
import { EventTypeOrmRepository } from './infrastructure/repositories/event-typeorm.repository';
import { TicketCategoryTypeOrmRepository } from './infrastructure/repositories/ticket-category-typeorm.repository';
import { TicketTypeOrmRepository } from './infrastructure/repositories/ticket-typeorm.repository';
import { PaymentTypeOrmRepository } from './infrastructure/repositories/payment-typeorm.repository';
import { QRCodeService } from './infrastructure/services/qrcode.service';
import { ILogger } from './application/interfaces/logger.interface';
import { IQRCodeService } from './application/interfaces/qrcode.interface';
import { IUserRepository } from './domain/interfaces/user-repository.interface';
import { IEventRepository } from './domain/interfaces/event-repository.interface';
import { ITicketRepository } from './domain/interfaces/ticket-repository.interface';
import { IPaymentRepository } from './domain/interfaces/payment-repository.interface';
import { ITicketCategoryRepository } from './domain/interfaces/ticket-category-repository.interface';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { GetEventByIdUseCase } from './application/use-cases/get-event-by-id.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { PurchaseTicketUseCase } from './application/use-cases/purchase-ticket.use-case';
import { ValidateTicketUseCase } from './application/use-cases/validate-ticket.use-case';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { AddTicketCategoriesToEventUseCase } from './application/use-cases/add-ticket-categories-to-event.use-case';
import { PromoteUserToOrganizerUseCase } from './application/use-cases/promote-user-to-organizer.use-case';
import { SearchEventsByQueryUseCase } from './application/use-cases/search-events-by-query.use-case';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, Ticket, Payment, TicketCategory, Scanner]),
  ],
  providers: [
    // Logger
    {
      provide: 'ILogger',
      useClass: ConsoleLoggerService,
    },

    // Services
    {
      provide: 'IQRCodeService',
      useClass: QRCodeService,
    },
    
    // Repositories
    {
      provide: 'IUserRepository',
      useClass: UserTypeOrmRepository,
    },
    {
      provide: 'IEventRepository',
      useClass: EventTypeOrmRepository,
    },
    {
      provide: 'ITicketRepository',
      useClass: TicketTypeOrmRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentTypeOrmRepository,
    },
    {
      provide: 'ITicketCategoryRepository',
      useClass: TicketCategoryTypeOrmRepository,
    },

    // Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    CreateEventUseCase,
    GetEventByIdUseCase,
    ListEventsUseCase,
    PurchaseTicketUseCase,
    ValidateTicketUseCase,
    CreatePaymentUseCase,
    AddTicketCategoriesToEventUseCase,
    PromoteUserToOrganizerUseCase,
    SearchEventsByQueryUseCase,
  ],
  exports: [
    'ILogger',
    'IQRCodeService',
    'IUserRepository',
    'IEventRepository',
    'ITicketRepository',
    'IPaymentRepository',
    'ITicketCategoryRepository',
    RegisterUserUseCase,
    LoginUserUseCase,
    CreateEventUseCase,
    GetEventByIdUseCase,
    ListEventsUseCase,
    PurchaseTicketUseCase,
    ValidateTicketUseCase,
    CreatePaymentUseCase,
    AddTicketCategoriesToEventUseCase,
    PromoteUserToOrganizerUseCase,
    SearchEventsByQueryUseCase,
  ],
})
export class SharedModule {}
