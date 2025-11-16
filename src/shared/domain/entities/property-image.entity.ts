import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('property_images')
export class PropertyImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailPath?: string;

  @Column({ type: 'boolean', default: false })
  isCover: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @ManyToOne(() => Property, (property) => property.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor vazio para TypeORM
  constructor() {}

  // Métodos de domínio
  public setAsCover(): void {
    this.isCover = true;
    this.updatedAt = new Date();
  }

  public removeAsCover(): void {
    this.isCover = false;
    this.updatedAt = new Date();
  }

  public updateOrder(newOrder: number): void {
    if (newOrder < 0) {
      throw new Error('Order must be greater than or equal to zero');
    }
    this.order = newOrder;
    this.updatedAt = new Date();
  }
}

