import { PropertyImage } from '../entities/property-image.entity';

export interface IPropertyImageRepository {
  save(image: PropertyImage): Promise<PropertyImage>;
  findById(id: string): Promise<PropertyImage | null>;
  findByPropertyId(propertyId: string): Promise<PropertyImage[]>;
  findCoverByPropertyId(propertyId: string): Promise<PropertyImage | null>;
  countByPropertyId(propertyId: string): Promise<number>;
  update(id: string, image: PropertyImage): Promise<PropertyImage>;
  delete(id: string): Promise<boolean>;
  deleteByPropertyId(propertyId: string): Promise<boolean>;
}

