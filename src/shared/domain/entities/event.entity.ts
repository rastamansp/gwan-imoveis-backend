import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { EventStatus } from '../value-objects/event-status.enum';

@Entity('events')
@Index(['organizerId'])
@Index(['status'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 16, nullable: true })
  code: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 2 })
  state: string;

  @Column({ type: 'varchar', length: 500 })
  image: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'uuid' })
  organizerId: string;

  @Column({ type: 'varchar', length: 255 })
  organizerName: string;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.ACTIVE })
  status: EventStatus;

  @Column({ type: 'int', default: 0 })
  maxCapacity: number;

  @Column({ type: 'int', default: 0 })
  soldTickets: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ type: 'real', array: true, nullable: true })
  embedding: number[] | null;

  @Column({ name: 'embedding_model', type: 'varchar', length: 100, nullable: true, default: 'text-embedding-3-small' })
  embeddingModel: string | null;

  // Constructor vazio para TypeORM
  constructor() {}

  // Constructor com parâmetros para criação manual
  static create(
    id: string,
    title: string,
    description: string,
    date: Date,
    location: string,
    address: string,
    city: string,
    state: string,
    image: string,
    category: string,
    organizerId: string,
    organizerName: string,
    status: EventStatus = EventStatus.ACTIVE,
    maxCapacity: number = 0,
    soldTickets: number = 0,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Event {
    const event = new Event();
    event.id = id;
    event.title = title;
    event.description = description;
    event.date = date;
    event.location = location;
    event.address = address;
    event.city = city;
    event.state = state;
    event.image = image;
    event.category = category;
    event.organizerId = organizerId;
    event.organizerName = organizerName;
    event.status = status;
    event.maxCapacity = maxCapacity;
    event.soldTickets = soldTickets;
    event.createdAt = createdAt;
    event.updatedAt = updatedAt;
    return event;
  }

  // Métodos de domínio
  public isActive(): boolean {
    return this.status === EventStatus.ACTIVE;
  }

  public isSoldOut(): boolean {
    return this.status === EventStatus.SOLD_OUT;
  }

  public isCancelled(): boolean {
    return this.status === EventStatus.CANCELLED;
  }

  public isInactive(): boolean {
    return this.status === EventStatus.INACTIVE;
  }

  public getAvailableTickets(): number {
    return Math.max(0, this.maxCapacity - this.soldTickets);
  }

  public canSellTickets(): boolean {
    return this.isActive() && this.getAvailableTickets() > 0;
  }

  public markAsSoldOut(): Event {
    this.status = EventStatus.SOLD_OUT;
    this.updatedAt = new Date();
    return this;
  }

  public addSoldTickets(quantity: number): Event {
    this.soldTickets += quantity;
    if (this.soldTickets >= this.maxCapacity) {
      this.status = EventStatus.SOLD_OUT;
    }
    this.updatedAt = new Date();
    return this;
  }

  public cancel(): Event {
    this.status = EventStatus.CANCELLED;
    this.updatedAt = new Date();
    return this;
  }

  public updateDetails(
    title: string,
    description: string,
    date: Date,
    location: string,
    address: string,
    city: string,
    state: string,
    image: string,
    category: string,
    maxCapacity: number,
  ): Event {
    this.title = title;
    this.description = description;
    this.date = date;
    this.location = location;
    this.address = address;
    this.city = city;
    this.state = state;
    this.image = image;
    this.category = category;
    this.maxCapacity = maxCapacity;
    this.updatedAt = new Date();
    return this;
  }

  public belongsTo(organizerId: string): boolean {
    return this.organizerId === organizerId;
  }
}
