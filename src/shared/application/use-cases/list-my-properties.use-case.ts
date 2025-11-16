import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class ListMyPropertiesUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(corretorId: string): Promise<Property[]> {
    this.logger.debug('Listando imóveis do corretor', {
      corretorId,
    });

    const properties = await this.propertyRepository.findByCorretorId(corretorId);
    
    this.logger.debug('Imóveis do corretor encontrados', {
      corretorId,
      count: properties.length,
    });

    return properties;
  }
}

