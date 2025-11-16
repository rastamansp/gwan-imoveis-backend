import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../shared/domain/entities/user.entity';
import { Conversation } from '../shared/domain/entities/conversation.entity';
import { Message } from '../shared/domain/entities/message.entity';
import { UserCredit } from '../shared/domain/entities/user-credit.entity';
import { Agent } from '../shared/domain/entities/agent.entity';
import { Property } from '../shared/domain/entities/property.entity';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [
    User,
    Conversation,
    Message,
    UserCredit,
    Agent,
    Property,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false, // Desabilitar logging de queries SQL
  ssl: false,
});

export default AppDataSource;
