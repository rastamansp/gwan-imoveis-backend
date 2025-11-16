import { Injectable, Inject } from '@nestjs/common';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { PropertyImage } from '../../domain/entities/property-image.entity';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class ListPropertyImagesUseCase {
  constructor(
    @Inject('IPropertyImageRepository')
    private readonly propertyImageRepository: IPropertyImageRepository,
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(propertyId: string): Promise<PropertyImage[]> {
    this.logger.debug('Listando imagens de propriedade', {
      propertyId,
    });

    // Verificar se a propriedade existe
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new Error('Propriedade não encontrada');
    }

    const images = await this.propertyImageRepository.findByPropertyId(propertyId);

    this.logger.debug('Imagens listadas com sucesso', {
      propertyId,
      count: images.length,
    });

    return images;
  }
}

