import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { McpModule } from './mcp/mcp.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { WhatsappWebhookModule } from './whatsapp-webhook/whatsapp-webhook.module';
import { RedisCacheModule } from './shared/cache/cache.module';
import { PropertiesModule } from './properties/properties.module';

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
    UsersModule,
    AdminModule,
    DatabaseModule,
    McpModule,
    ChatModule,
    HealthModule,
    WhatsappWebhookModule,
    PropertiesModule,
  ],
})
export class AppModule {}
