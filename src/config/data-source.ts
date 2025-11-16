import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../shared/domain/entities/user.entity';
import { Event } from '../shared/domain/entities/event.entity';
import { Ticket } from '../shared/domain/entities/ticket.entity';
import { Payment } from '../shared/domain/entities/payment.entity';
import { TicketCategory } from '../shared/domain/entities/ticket-category.entity';
import { Scanner } from '../shared/domain/entities/scanner.entity';
import { Artist } from '../shared/domain/entities/artist.entity';
import { Conversation } from '../shared/domain/entities/conversation.entity';
import { Message } from '../shared/domain/entities/message.entity';
import { UserCredit } from '../shared/domain/entities/user-credit.entity';
import { Product } from '../shared/domain/entities/product.entity';
import { Order } from '../shared/domain/entities/order.entity';
import { OrderItem } from '../shared/domain/entities/order-item.entity';
import { Agent } from '../shared/domain/entities/agent.entity';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL') || 'postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_events',
  entities: [
    User,
    Event,
    Ticket,
    Payment,
    TicketCategory,
    Scanner,
    Artist,
    Conversation,
    Message,
    UserCredit,
    Product,
    Order,
    OrderItem,
    Agent,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false, // Desabilitar logging de queries SQL
  ssl: false,
});

export default AppDataSource;
