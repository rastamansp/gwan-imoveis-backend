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

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    forwardRef(() => WhatsappWebhookModule),
  ],
  controllers: [PropertiesController, PropertyImagesController],
  providers: [
    {
      provide: 'IPropertyRepository',
      useClass: PropertyTypeOrmRepository,
    },
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeletePropertyUseCase,
    GetPropertyByIdUseCase,
    ListPropertiesUseCase,
    ListMyPropertiesUseCase,
    GeneratePropertyEmbeddingUseCase,
    SearchPropertiesSemanticUseCase,
    RealtorContactResolverService,
  ],
  exports: ['IPropertyRepository'],
})
export class PropertiesModule {}

