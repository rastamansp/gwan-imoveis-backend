import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../domain/entities/property.entity';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';

@Injectable()
export class PropertyTypeOrmRepository implements IPropertyRepository {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async save(property: Property): Promise<Property> {
    return this.propertyRepository.save(property);
  }

  async findById(id: string): Promise<Property | null> {
    return this.propertyRepository.findOne({
      where: { id },
      relations: ['realtor', 'realtor.realtorProfile'],
    });
  }

  async findAll(): Promise<Property[]> {
    return this.propertyRepository.find({
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCorretorId(realtorId: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { realtorId },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCity(city: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { city },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: string): Promise<Property[]> {
    return this.propertyRepository.find({
      where: { type: type as any },
      relations: ['realtor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Property[]> {
    return this.propertyRepository
      .createQueryBuilder('property')
      .where('property.price >= :minPrice', { minPrice })
      .andWhere('property.price <= :maxPrice', { maxPrice })
      .leftJoinAndSelect('property.realtor', 'realtor')
      .orderBy('property.createdAt', 'DESC')
      .getMany();
  }

  async update(id: string, property: Property): Promise<Property> {
    await this.propertyRepository.update(id, property);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Property not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.propertyRepository.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }
}

