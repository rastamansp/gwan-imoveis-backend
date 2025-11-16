import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { Conversation } from './domain/entities/conversation.entity';
import { Message } from './domain/entities/message.entity';
import { UserCredit } from './domain/entities/user-credit.entity';
import { Agent } from './domain/entities/agent.entity';
import { Property } from './domain/entities/property.entity';
import { PropertyImage } from './domain/entities/property-image.entity';
import { ConsoleLoggerService } from './infrastructure/logger/console-logger.service';
import { UserTypeOrmRepository } from './infrastructure/repositories/user-typeorm.repository';
import { ConversationTypeOrmRepository } from './infrastructure/repositories/conversation-typeorm.repository';
import { MessageTypeOrmRepository } from './infrastructure/repositories/message-typeorm.repository';
import { UserCreditTypeOrmRepository } from './infrastructure/repositories/user-credit-typeorm.repository';
import { QRCodeService } from './infrastructure/services/qrcode.service';
import { EmbeddingService } from './infrastructure/services/embedding.service';
import { ILogger } from './application/interfaces/logger.interface';
import { IQRCodeService } from './application/interfaces/qrcode.interface';
import { IEmbeddingService } from './application/interfaces/embedding-service.interface';
import { IUserRepository } from './domain/interfaces/user-repository.interface';
import { IConversationRepository } from './domain/interfaces/conversation-repository.interface';
import { IMessageRepository } from './domain/interfaces/message-repository.interface';
import { IUserCreditRepository } from './domain/interfaces/user-credit-repository.interface';
import { IAgentRepository } from './domain/interfaces/agent-repository.interface';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { PromoteUserToCorretorUseCase } from './application/use-cases/promote-user-to-corretor.use-case';
import { CreateOrFindConversationUseCase } from './application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from './application/use-cases/save-message.use-case';
import { RegisterUserViaWhatsappUseCase } from './application/use-cases/register-user-via-whatsapp.use-case';
import { AddCreditUseCase } from './application/use-cases/add-credit.use-case';
import { GetUserBalanceUseCase } from './application/use-cases/get-user-balance.use-case';
import { GetOrSetUserPreferredAgentUseCase } from './application/use-cases/get-or-set-user-preferred-agent.use-case';
import { ResolveConversationAgentUseCase } from './application/use-cases/resolve-conversation-agent.use-case';
import { AgentTypeOrmRepository } from './infrastructure/repositories/agent-typeorm.repository';
import { PropertyTypeOrmRepository } from './infrastructure/repositories/property-typeorm.repository';
import { PropertyImageTypeOrmRepository } from './infrastructure/repositories/property-image-typeorm.repository';
import { IPropertyRepository } from './domain/interfaces/property-repository.interface';
import { MinioStorageService } from './infrastructure/services/minio-storage.service';
import { ImageProcessorService } from './infrastructure/services/image-processor.service';
import { IPropertyImageRepository } from './domain/interfaces/property-image-repository.interface';
import { IStorageService } from './application/interfaces/storage-service.interface';
import { IImageProcessorService } from './application/interfaces/image-processor-service.interface';
import { CreatePropertyImageUseCase } from './application/use-cases/create-property-image.use-case';
import { SetCoverImageUseCase } from './application/use-cases/set-cover-image.use-case';
import { DeletePropertyImageUseCase } from './application/use-cases/delete-property-image.use-case';
import { ListPropertyImagesUseCase } from './application/use-cases/list-property-images.use-case';
import { ReorderPropertyImagesUseCase } from './application/use-cases/reorder-property-images.use-case';
import { forwardRef } from '@nestjs/common';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Conversation, Message, UserCredit, Agent, Property, PropertyImage]),
    forwardRef(() => {
      const { WhatsappWebhookModule } = require('../whatsapp-webhook/whatsapp-webhook.module');
      return WhatsappWebhookModule;
    }),
    forwardRef(() => {
      const { ChatModule } = require('../chat/chat.module');
      return ChatModule;
    }),
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
    {
      provide: 'IEmbeddingService',
      useClass: EmbeddingService,
    },
    
    // Repositories
    {
      provide: 'IUserRepository',
      useClass: UserTypeOrmRepository,
    },
    {
      provide: 'IConversationRepository',
      useClass: ConversationTypeOrmRepository,
    },
    {
      provide: 'IMessageRepository',
      useClass: MessageTypeOrmRepository,
    },
    {
      provide: 'IUserCreditRepository',
      useClass: UserCreditTypeOrmRepository,
    },
    {
      provide: 'IAgentRepository',
      useClass: AgentTypeOrmRepository,
    },
    {
      provide: 'IPropertyRepository',
      useClass: PropertyTypeOrmRepository,
    },
    {
      provide: 'IPropertyImageRepository',
      useClass: PropertyImageTypeOrmRepository,
    },
    {
      provide: 'IStorageService',
      useClass: MinioStorageService,
    },
    {
      provide: 'IImageProcessorService',
      useClass: ImageProcessorService,
    },

    // Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,
    PromoteUserToCorretorUseCase,
    CreateOrFindConversationUseCase,
    SaveMessageUseCase,
    RegisterUserViaWhatsappUseCase,
    AddCreditUseCase,
    GetUserBalanceUseCase,
    GetOrSetUserPreferredAgentUseCase,
    ResolveConversationAgentUseCase,
    CreatePropertyImageUseCase,
    SetCoverImageUseCase,
    DeletePropertyImageUseCase,
    ListPropertyImagesUseCase,
    ReorderPropertyImagesUseCase,
  ],
  exports: [
    'ILogger',
    'IQRCodeService',
    'IEmbeddingService',
    'IUserRepository',
    'IConversationRepository',
    'IMessageRepository',
    'IUserCreditRepository',
    'IAgentRepository',
    'IPropertyRepository',
    'IPropertyImageRepository',
    'IStorageService',
    'IImageProcessorService',
    RegisterUserUseCase,
    LoginUserUseCase,
    PromoteUserToCorretorUseCase,
    CreateOrFindConversationUseCase,
    SaveMessageUseCase,
    RegisterUserViaWhatsappUseCase,
    AddCreditUseCase,
    GetUserBalanceUseCase,
    GetOrSetUserPreferredAgentUseCase,
    ResolveConversationAgentUseCase,
    CreatePropertyImageUseCase,
    SetCoverImageUseCase,
    DeletePropertyImageUseCase,
    ListPropertyImagesUseCase,
    ReorderPropertyImagesUseCase,
  ],
})
export class SharedModule {}
