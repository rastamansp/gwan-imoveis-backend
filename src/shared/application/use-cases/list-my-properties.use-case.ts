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

  async execute(realtorId: string): Promise<Property[]> {
    this.logger.debug('Listing realtor properties', {
      realtorId,
    });

    const properties = await this.propertyRepository.findByCorretorId(realtorId);
    
    this.logger.debug('Realtor properties found', {
      realtorId,
      count: properties.length,
    });

    return properties;
  }
}

