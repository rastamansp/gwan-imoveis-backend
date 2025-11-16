import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyImage } from '../../domain/entities/property-image.entity';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';

@Injectable()
export class PropertyImageTypeOrmRepository implements IPropertyImageRepository {
  constructor(
    @InjectRepository(PropertyImage)
    private readonly repository: Repository<PropertyImage>,
  ) {}

  async save(image: PropertyImage): Promise<PropertyImage> {
    return await this.repository.save(image);
  }

  async findById(id: string): Promise<PropertyImage | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByPropertyId(propertyId: string): Promise<PropertyImage[]> {
    return await this.repository.find({
      where: { propertyId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findCoverByPropertyId(propertyId: string): Promise<PropertyImage | null> {
    return await this.repository.findOne({
      where: { propertyId, isCover: true },
    });
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return await this.repository.count({ where: { propertyId } });
  }

  async update(id: string, image: PropertyImage): Promise<PropertyImage> {
    await this.repository.update(id, image);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('PropertyImage not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async deleteByPropertyId(propertyId: string): Promise<boolean> {
    const result = await this.repository.delete({ propertyId });
    return result.affected !== undefined && result.affected > 0;
  }
}

