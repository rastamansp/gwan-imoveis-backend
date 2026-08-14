import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertyImagesController } from './property-images.controller';
import { Property } from '../shared/domain/entities/property.entity';
import { PropertyTypeOrmRepository } from '../shared/infrastructure/repositories/property-typeorm.repository';
import { IPropertyRepository } from '../shared/domain/interfaces/property-repository.interface';
import { CreatePropertyUseCase } from '../shared/application/use-cases/create-property.use-case';
import { UpdatePropertyUseCase } from '../shared/application/use-cases/update-property.use-case';
import { DeletePropertyUseCase } from '../shared/application/use-cases/delete-property.use-case';
import { GetPropertyByIdUseCase } from '../shared/application/use-cases/get-property-by-id.use-case';
import { ListPropertiesUseCase } from '../shared/application/use-cases/list-properties.use-case';
import { ListMyPropertiesUseCase } from '../shared/application/use-cases/list-my-properties.use-case';
import { GeneratePropertyEmbeddingUseCase } from '../shared/application/use-cases/generate-property-embedding.use-case';
import { SearchPropertiesSemanticUseCase } from '../shared/application/use-cases/search-properties-semantic.use-case';
import { WhatsappWebhookModule } from '../whatsapp-webhook/whatsapp-webhook.module';
import { RealtorContactResolverService } from './services/realtor-contact-resolver.service';
import { PropertyPdfService } from './services/property-pdf.service';
import { PropertyPdfCacheService } from './services/property-pdf-cache.service';
import { ExtractPropertyFromTextUseCase } from '../shared/application/use-cases/extract-property-from-text.use-case';
import { ManagePropertyTourUseCase } from '../shared/application/use-cases/manage-property-tour.use-case';
import { PropertyTourController } from './property-tour.controller';
import { PropertyTourScene } from '../shared/domain/entities/property-tour-scene.entity';
import { PropertyTourSceneTypeOrmRepository } from '../shared/infrastructure/repositories/property-tour-scene-typeorm.repository';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyTourScene]),
    forwardRef(() => WhatsappWebhookModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [PropertiesController, PropertyImagesController, PropertyTourController],
  providers: [
    {
      provide: 'IPropertyRepository',
      useClass: PropertyTypeOrmRepository,
    },
    {
      provide: 'IPropertyTourSceneRepository',
      useClass: PropertyTourSceneTypeOrmRepository,
    },
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeletePropertyUseCase,
    GetPropertyByIdUseCase,
    ListPropertiesUseCase,
    ListMyPropertiesUseCase,
    GeneratePropertyEmbeddingUseCase,
    SearchPropertiesSemanticUseCase,
    ExtractPropertyFromTextUseCase,
    ManagePropertyTourUseCase,
    RealtorContactResolverService,
    PropertyPdfService,
    PropertyPdfCacheService,
  ],
  exports: ['IPropertyRepository'],
})
export class PropertiesModule {}

