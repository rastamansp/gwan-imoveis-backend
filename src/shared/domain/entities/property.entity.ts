import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PropertyType } from '../value-objects/property-type.enum';
import { User } from './user.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: PropertyType })
  type: PropertyType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255 })
  neighborhood: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'int', nullable: true })
  bedrooms?: number;

  @Column({ type: 'int', nullable: true })
  bathrooms?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  area: number;

  @Column({ type: 'int', nullable: true })
  garageSpaces?: number;

  // Comodidades
  @Column({ type: 'boolean', default: false })
  piscina: boolean;

  @Column({ type: 'boolean', default: false })
  hidromassagem: boolean;

  @Column({ type: 'boolean', default: false })
  frenteMar: boolean;

  @Column({ type: 'boolean', default: false })
  jardim: boolean;

  @Column({ type: 'boolean', default: false })
  areaGourmet: boolean;

  @Column({ type: 'boolean', default: false })
  mobiliado: boolean;

  // Relacionamento com corretor
  @Column({ type: 'uuid' })
  corretorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'corretorId' })
  corretor: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor vazio para TypeORM
  constructor() {}

  // Métodos de domínio
  public belongsToCorretor(corretorId: string): boolean {
    return this.corretorId === corretorId;
  }

  public updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('Price must be greater than zero');
    }
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  public updateArea(newArea: number): void {
    if (newArea <= 0) {
      throw new Error('Area must be greater than zero');
    }
    this.area = newArea;
    this.updatedAt = new Date();
  }
}

