import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../domain/entities/product.entity';
import { IProductRepository } from '../../domain/interfaces/product-repository.interface';

@Injectable()
export class ProductTypeOrmRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async save(product: Product): Promise<Product> {
    return await this.productRepository.save(product);
  }

  async findById(id: string): Promise<Product | null> {
    return await this.productRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findByEventId(eventId: string): Promise<Product[]> {
    return await this.productRepository.find({ where: { eventId } });
  }

  async findByEventIdAndActive(eventId: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { eventId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updatedProduct: Product): Promise<Product | null> {
    const result = await this.productRepository.update(id, updatedProduct);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected > 0;
  }
}

