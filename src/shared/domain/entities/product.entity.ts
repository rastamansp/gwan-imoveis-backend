import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Event } from './event.entity';
import { ProductCategory } from '../value-objects/product-category.enum';

@Entity('products')
@Index(['eventId'])
@Index(['isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Métodos estáticos
  public static create(
    eventId: string,
    name: string,
    price: number,
    category: ProductCategory,
    description?: string | null,
    image?: string | null,
    isActive: boolean = true,
  ): Product {
    const product = new Product();
    product.eventId = eventId;
    product.name = name;
    product.description = description || null;
    product.price = price;
    product.category = category;
    product.image = image || null;
    product.isActive = isActive;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    return product;
  }

  // Métodos de domínio
  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public updateDetails(
    name: string,
    price: number,
    category: ProductCategory,
    description?: string | null,
    image?: string | null,
  ): void {
    this.name = name;
    this.price = price;
    this.category = category;
    this.description = description || null;
    this.image = image || null;
    this.updatedAt = new Date();
  }

  public getPrice(): number {
    return Number(this.price);
  }

  public belongsToEvent(eventId: string): boolean {
    return this.eventId === eventId;
  }
}

