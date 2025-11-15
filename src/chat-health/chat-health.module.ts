import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getKnowledgeDatabaseConfig } from '../config/knowledge-database.config';
import { KnowledgeDisease } from '../shared/domain/entities/knowledge-disease.entity';
import { KnowledgeDiseaseTypeOrmRepository } from '../shared/infrastructure/repositories/knowledge-disease-typeorm.repository';
import { IKnowledgeDiseaseRepository } from '../shared/domain/interfaces/knowledge-disease-repository.interface';
import { ChatbotHealthQueryUseCase } from '../shared/application/use-cases/chatbot-health-query.use-case';
import { ChatHealthController } from './chat-health.controller';
import { SharedModule } from '../shared/shared.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    // Configurar TypeORM com conexão ao banco de conhecimento
    TypeOrmModule.forRootAsync({
      name: 'knowledge',
      imports: [ConfigModule],
      useFactory: getKnowledgeDatabaseConfig,
      inject: [ConfigService],
    }),
    // Registrar entidade KnowledgeDisease na conexão knowledge
    TypeOrmModule.forFeature([KnowledgeDisease], 'knowledge'),
    // Importar módulos necessários
    SharedModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [ChatHealthController],
  providers: [
    // Repositório
    KnowledgeDiseaseTypeOrmRepository,
    {
      provide: 'IKnowledgeDiseaseRepository',
      useClass: KnowledgeDiseaseTypeOrmRepository,
    },
    // Use Case
    ChatbotHealthQueryUseCase,
  ],
  exports: [
    'IKnowledgeDiseaseRepository',
    KnowledgeDiseaseTypeOrmRepository,
    ChatbotHealthQueryUseCase,
  ],
})
export class ChatHealthModule {}

