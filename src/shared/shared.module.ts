import { Module, Global } from '@nestjs/common';
import { ConsoleLoggerService } from './infrastructure/logger/console-logger.service';
import { UserInMemoryRepository } from './infrastructure/repositories/user-in-memory.repository';
import { EventInMemoryRepository } from './infrastructure/repositories/event-in-memory.repository';
import { TicketInMemoryRepository } from './infrastructure/repositories/ticket-in-memory.repository';
import { PaymentInMemoryRepository } from './infrastructure/repositories/payment-in-memory.repository';
import { TicketCategoryInMemoryRepository } from './infrastructure/repositories/ticket-category-in-memory.repository';
import { ILogger } from './application/interfaces/logger.interface';
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

@Global()
@Module({
  providers: [
    // Logger
    {
      provide: 'ILogger',
      useClass: ConsoleLoggerService,
    },
    
    // Repositories
    {
      provide: 'IUserRepository',
      useClass: UserInMemoryRepository,
    },
    {
      provide: 'IEventRepository',
      useClass: EventInMemoryRepository,
    },
    {
      provide: 'ITicketRepository',
      useClass: TicketInMemoryRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: PaymentInMemoryRepository,
    },
    {
      provide: 'ITicketCategoryRepository',
      useClass: TicketCategoryInMemoryRepository,
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
  ],
  exports: [
    'ILogger',
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
  ],
})
export class SharedModule {}
