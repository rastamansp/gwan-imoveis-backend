import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { ILogger } from '../interfaces/logger.interface';

export interface ListPropertiesFilters {
  city?: string;
  type?: string;
  purpose?: string;
  minPrice?: number;
  maxPrice?: number;
  realtorId?: string;
}

@Injectable()
export class ListPropertiesUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(filters?: ListPropertiesFilters): Promise<Property[]> {
    this.logger.debug('Listando imóveis', {
      filters,
    });

    // Se não há filtros, retornar todos
    if (!filters || Object.keys(filters).length === 0) {
      return this.propertyRepository.findAll();
    }

    // Aplicar filtros
    let properties: Property[] = [];

    if (filters.realtorId) {
      properties = await this.propertyRepository.findByCorretorId(filters.realtorId);
    } else if (filters.city) {
      properties = await this.propertyRepository.findByCity(filters.city);
    } else if (filters.type) {
      properties = await this.propertyRepository.findByType(filters.type);
    } else {
      properties = await this.propertyRepository.findAll();
    }

    // Aplicar filtro de preço se fornecido
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const minPrice = filters.minPrice ?? 0;
      const maxPrice = filters.maxPrice ?? Number.MAX_SAFE_INTEGER;
      properties = properties.filter(
        (p) => Number(p.price) >= minPrice && Number(p.price) <= maxPrice,
      );
    }

    // Aplicar outros filtros se necessário
    if (filters.type && !filters.realtorId && !filters.city) {
      properties = properties.filter((p) => p.type === filters.type);
    }

    // Aplicar filtro por purpose se fornecido
    if (filters.purpose) {
      properties = properties.filter((p) => p.purpose === filters.purpose);
    }

    return properties;
  }
}

