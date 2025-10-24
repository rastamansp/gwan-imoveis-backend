import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../shared/domain/entities/user.entity';
import { Event } from '../shared/domain/entities/event.entity';

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL') || 'postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_events',
  entities: [User, Event],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: false,
});

export default AppDataSource;
