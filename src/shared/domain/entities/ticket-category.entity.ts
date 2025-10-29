import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity('ticket_categories')
@Index(['eventId'])
export class TicketCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int' })
  maxQuantity: number;

  @Column({ type: 'int', default: 0 })
  soldQuantity: number;

  @Column({ type: 'jsonb', default: '[]' })
  benefits: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // Construtor vazio para TypeORM
  constructor() {}

  // Método estático para criação manual
  static create(
    id: string,
    eventId: string,
    name: string,
    description: string,
    price: number,
    maxQuantity: number,
    soldQuantity: number = 0,
    benefits: string[] = [],
    isActive: boolean = true,
  ): TicketCategory {
    const category = new TicketCategory();
    category.id = id;
    category.eventId = eventId;
    category.name = name;
    category.description = description;
    category.price = price;
    category.maxQuantity = maxQuantity;
    category.soldQuantity = soldQuantity;
    category.benefits = benefits;
    category.isActive = isActive;
    return category;
  }

  // Métodos de domínio
  public getAvailableQuantity(): number {
    return Math.max(0, this.maxQuantity - this.soldQuantity);
  }

  public canSell(quantity: number): boolean {
    return this.isActive && this.getAvailableQuantity() >= quantity;
  }

  public isSoldOut(): boolean {
    return this.getAvailableQuantity() === 0;
  }

  public sell(quantity: number): void {
    if (!this.canSell(quantity)) {
      throw new Error('Cannot sell this quantity of tickets');
    }

    this.soldQuantity += quantity;
  }

  public updateDetails(
    name: string,
    description: string,
    price: number,
    maxQuantity: number,
    benefits: string[],
  ): void {
    this.name = name;
    this.description = description;
    this.price = price;
    this.maxQuantity = maxQuantity;
    this.benefits = benefits;
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public activate(): void {
    this.isActive = true;
  }

  public belongsToEvent(eventId: string): boolean {
    return this.eventId === eventId;
  }
}
