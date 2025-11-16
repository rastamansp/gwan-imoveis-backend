import { Property } from '../entities/property.entity';

export interface IPropertyRepository {
  save(property: Property): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  findAll(): Promise<Property[]>;
  findByCorretorId(corretorId: string): Promise<Property[]>;
  findByCity(city: string): Promise<Property[]>;
  findByType(type: string): Promise<Property[]>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Property[]>;
  update(id: string, property: Property): Promise<Property>;
  delete(id: string): Promise<boolean>;
}

