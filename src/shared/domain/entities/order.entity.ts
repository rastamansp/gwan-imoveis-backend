import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { Ticket } from './ticket.entity';
import { OrderStatus } from '../value-objects/order-status.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index(['userId'])
@Index(['eventId'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'uuid', nullable: true })
  ticketId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket | null;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  // Métodos estáticos
  public static create(
    userId: string,
    eventId: string,
    totalAmount: number,
    ticketId?: string | null,
  ): Order {
    const order = new Order();
    order.userId = userId;
    order.eventId = eventId;
    order.ticketId = ticketId || null;
    order.totalAmount = totalAmount;
    order.status = OrderStatus.PENDING;
    order.createdAt = new Date();
    order.updatedAt = new Date();
    return order;
  }

  // Métodos de domínio
  public confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Order cannot be confirmed');
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status === OrderStatus.CONFIRMED) {
      throw new Error('Confirmed orders cannot be cancelled');
    }
    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  public getTotalAmount(): number {
    return Number(this.totalAmount);
  }

  public belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  public belongsToEvent(eventId: string): boolean {
    return this.eventId === eventId;
  }
}

