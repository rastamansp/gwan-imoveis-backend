import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class GetPropertyByIdUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(propertyId: string): Promise<Property> {
    this.logger.debug('Buscando imóvel por ID', {
      propertyId,
    });

    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new Error('Imóvel não encontrado');
    }

    return property;
  }
}

