import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { ScannersModule } from './scanners/scanners.module';
import { DatabaseModule } from './database/database.module';
import { McpModule } from './mcp/mcp.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { ArtistsModule } from './artists/artists.module';
import { WhatsappWebhookModule } from './whatsapp-webhook/whatsapp-webhook.module';
import { RedisCacheModule } from './shared/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    RedisCacheModule,
    SharedModule,
    AuthModule,
    EventsModule,
    TicketsModule,
    UsersModule,
    PaymentsModule,
    AdminModule,
    ScannersModule,
    DatabaseModule,
    McpModule,
    ChatModule,
    HealthModule,
    ArtistsModule,
    WhatsappWebhookModule,
  ],
})
export class AppModule {}
