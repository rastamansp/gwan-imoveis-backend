import { Product } from '../entities/product.entity';

export const IProductRepository = Symbol('IProductRepository');

export interface IProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByEventId(eventId: string): Promise<Product[]>;
  findByEventIdAndActive(eventId: string): Promise<Product[]>;
  update(id: string, product: Product): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}

