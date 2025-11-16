import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { Event } from './domain/entities/event.entity';
import { Ticket } from './domain/entities/ticket.entity';
import { Payment } from './domain/entities/payment.entity';
import { TicketCategory } from './domain/entities/ticket-category.entity';
import { Scanner } from './domain/entities/scanner.entity';
import { Artist } from './domain/entities/artist.entity';
import { Conversation } from './domain/entities/conversation.entity';
import { Message } from './domain/entities/message.entity';
import { UserCredit } from './domain/entities/user-credit.entity';
import { Product } from './domain/entities/product.entity';
import { Order } from './domain/entities/order.entity';
import { OrderItem } from './domain/entities/order-item.entity';
import { Agent } from './domain/entities/agent.entity';
import { ConsoleLoggerService } from './infrastructure/logger/console-logger.service';
import { UserTypeOrmRepository } from './infrastructure/repositories/user-typeorm.repository';
import { EventTypeOrmRepository } from './infrastructure/repositories/event-typeorm.repository';
import { TicketCategoryTypeOrmRepository } from './infrastructure/repositories/ticket-category-typeorm.repository';
import { TicketTypeOrmRepository } from './infrastructure/repositories/ticket-typeorm.repository';
import { PaymentTypeOrmRepository } from './infrastructure/repositories/payment-typeorm.repository';
import { ArtistTypeOrmRepository } from './infrastructure/repositories/artist-typeorm.repository';
import { ConversationTypeOrmRepository } from './infrastructure/repositories/conversation-typeorm.repository';
import { MessageTypeOrmRepository } from './infrastructure/repositories/message-typeorm.repository';
import { UserCreditTypeOrmRepository } from './infrastructure/repositories/user-credit-typeorm.repository';
import { ProductTypeOrmRepository } from './infrastructure/repositories/product-typeorm.repository';
import { OrderTypeOrmRepository, OrderItemTypeOrmRepository } from './infrastructure/repositories/order-typeorm.repository';
import { QRCodeService } from './infrastructure/services/qrcode.service';
import { EmbeddingService } from './infrastructure/services/embedding.service';
import { EventContentService } from './infrastructure/services/event-content.service';
import { ArtistContentService } from './infrastructure/services/artist-content.service';
import { SpotifyAuthService } from './infrastructure/services/spotify-auth.service';
import { SpotifyService } from './infrastructure/services/spotify.service';
import { ILogger } from './application/interfaces/logger.interface';
import { IQRCodeService } from './application/interfaces/qrcode.interface';
import { IEmbeddingService } from './application/interfaces/embedding-service.interface';
import { ISpotifyService } from './application/interfaces/spotify-service.interface';
import { IUserRepository } from './domain/interfaces/user-repository.interface';
import { IEventRepository } from './domain/interfaces/event-repository.interface';
import { ITicketRepository } from './domain/interfaces/ticket-repository.interface';
import { IPaymentRepository } from './domain/interfaces/payment-repository.interface';
import { ITicketCategoryRepository } from './domain/interfaces/ticket-category-repository.interface';
import { IArtistRepository } from './domain/interfaces/artist-repository.interface';
import { IConversationRepository } from './domain/interfaces/conversation-repository.interface';
import { IMessageRepository } from './domain/interfaces/message-repository.interface';
import { IUserCreditRepository } from './domain/interfaces/user-credit-repository.interface';
import { IProductRepository } from './domain/interfaces/product-repository.interface';
import { IOrderRepository, IOrderItemRepository } from './domain/interfaces/order-repository.interface';
import { IAgentRepository } from './domain/interfaces/agent-repository.interface';
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
import { SearchEventsRagUseCase } from './application/use-cases/search-events-rag.use-case';
import { SearchArtistsRagUseCase } from './application/use-cases/search-artists-rag.use-case';
import { CreateArtistUseCase } from './application/use-cases/create-artist.use-case';
import { GetArtistByIdUseCase } from './application/use-cases/get-artist-by-id.use-case';
import { ListArtistsUseCase } from './application/use-cases/list-artists.use-case';
import { SearchArtistsUseCase } from './application/use-cases/search-artists.use-case';
import { GetArtistsByEventUseCase } from './application/use-cases/get-artists-by-event.use-case';
import { UpdateArtistUseCase } from './application/use-cases/update-artist.use-case';
import { DeleteArtistUseCase } from './application/use-cases/delete-artist.use-case';
import { LinkArtistToEventUseCase } from './application/use-cases/link-artist-to-event.use-case';
import { UnlinkArtistFromEventUseCase } from './application/use-cases/unlink-artist-from-event.use-case';
import { FetchAndUpdateArtistFromSpotifyUseCase } from './application/use-cases/fetch-and-update-artist-from-spotify.use-case';
import { CreateOrFindConversationUseCase } from './application/use-cases/create-or-find-conversation.use-case';
import { SaveMessageUseCase } from './application/use-cases/save-message.use-case';
import { RegisterUserViaWhatsappUseCase } from './application/use-cases/register-user-via-whatsapp.use-case';
import { GetUserTicketsByEventUseCase } from './application/use-cases/get-user-tickets-by-event.use-case';
import { AddCreditUseCase } from './application/use-cases/add-credit.use-case';
import { GetUserBalanceUseCase } from './application/use-cases/get-user-balance.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetEventProductsUseCase } from './application/use-cases/get-event-products.use-case';
import { PurchaseProductsUseCase } from './application/use-cases/purchase-products.use-case';
import { ValidateProductQRUseCase } from './application/use-cases/validate-product-qr.use-case';
import { GetOrSetUserPreferredAgentUseCase } from './application/use-cases/get-or-set-user-preferred-agent.use-case';
import { ResolveConversationAgentUseCase } from './application/use-cases/resolve-conversation-agent.use-case';
import { ChatbotHealthQueryUseCase } from './application/use-cases/chatbot-health-query.use-case';
import { AgentTypeOrmRepository } from './infrastructure/repositories/agent-typeorm.repository';
import { forwardRef } from '@nestjs/common';
import { KnowledgeDisease } from './domain/entities/knowledge-disease.entity';
import { KnowledgeDiseaseTypeOrmRepository } from './infrastructure/repositories/knowledge-disease-typeorm.repository';
import { IKnowledgeDiseaseRepository } from './domain/interfaces/knowledge-disease-repository.interface';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Event, Ticket, Payment, TicketCategory, Scanner, Artist, Conversation, Message, UserCredit, Product, Order, OrderItem, Agent]),
    // Conexão de conhecimento (doenças) usando data source 'knowledge'
    TypeOrmModule.forFeature([KnowledgeDisease], 'knowledge'),
    forwardRef(() => {
      const { WhatsappWebhookModule } = require('../whatsapp-webhook/whatsapp-webhook.module');
      return WhatsappWebhookModule;
    }),
    forwardRef(() => {
      const { ChatModule } = require('../chat/chat.module');
      return ChatModule;
    }),
    forwardRef(() => {
      const { ProductsModule } = require('../products/products.module');
      return ProductsModule;
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
    EventContentService,
    ArtistContentService,
    SpotifyAuthService,
    {
      provide: 'ISpotifyService',
      useClass: SpotifyService,
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
    {
      provide: 'IArtistRepository',
      useClass: ArtistTypeOrmRepository,
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
      provide: 'IProductRepository',
      useClass: ProductTypeOrmRepository,
    },
    {
      provide: 'IOrderRepository',
      useClass: OrderTypeOrmRepository,
    },
    {
      provide: 'IOrderItemRepository',
      useClass: OrderItemTypeOrmRepository,
    },
    {
      provide: 'IAgentRepository',
      useClass: AgentTypeOrmRepository,
    },
    {
      provide: 'IKnowledgeDiseaseRepository',
      useClass: KnowledgeDiseaseTypeOrmRepository,
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
    SearchEventsRagUseCase,
    SearchArtistsRagUseCase,
    CreateArtistUseCase,
    GetArtistByIdUseCase,
    ListArtistsUseCase,
    SearchArtistsUseCase,
    GetArtistsByEventUseCase,
    UpdateArtistUseCase,
    DeleteArtistUseCase,
    LinkArtistToEventUseCase,
    UnlinkArtistFromEventUseCase,
    FetchAndUpdateArtistFromSpotifyUseCase,
    CreateOrFindConversationUseCase,
    SaveMessageUseCase,
    RegisterUserViaWhatsappUseCase,
    GetUserTicketsByEventUseCase,
    AddCreditUseCase,
    GetUserBalanceUseCase,
    CreateProductUseCase,
    GetEventProductsUseCase,
    PurchaseProductsUseCase,
    ValidateProductQRUseCase,
    GetOrSetUserPreferredAgentUseCase,
    ResolveConversationAgentUseCase,
    ChatbotHealthQueryUseCase,
  ],
  exports: [
    'ILogger',
    'IQRCodeService',
    'IEmbeddingService',
    'ISpotifyService',
    EventContentService,
    ArtistContentService,
    'IUserRepository',
    'IEventRepository',
    'ITicketRepository',
    'IPaymentRepository',
    'ITicketCategoryRepository',
    'IArtistRepository',
    'IConversationRepository',
    'IMessageRepository',
    'IUserCreditRepository',
    'IProductRepository',
    'IOrderRepository',
    'IOrderItemRepository',
      'IAgentRepository',
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
    SearchEventsRagUseCase,
    SearchArtistsRagUseCase,
    CreateArtistUseCase,
    GetArtistByIdUseCase,
    ListArtistsUseCase,
    SearchArtistsUseCase,
    GetArtistsByEventUseCase,
    UpdateArtistUseCase,
    DeleteArtistUseCase,
    LinkArtistToEventUseCase,
    UnlinkArtistFromEventUseCase,
    FetchAndUpdateArtistFromSpotifyUseCase,
    CreateOrFindConversationUseCase,
    SaveMessageUseCase,
    RegisterUserViaWhatsappUseCase,
    GetUserTicketsByEventUseCase,
    AddCreditUseCase,
    GetUserBalanceUseCase,
    CreateProductUseCase,
    GetEventProductsUseCase,
    PurchaseProductsUseCase,
    ValidateProductQRUseCase,
    GetOrSetUserPreferredAgentUseCase,
    ResolveConversationAgentUseCase,
    ChatbotHealthQueryUseCase,
  ],
})
export class SharedModule {}
