import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { TicketStatus } from '../value-objects/ticket-status.enum';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  eventTitle: string;

  @Column({ type: 'timestamp' })
  eventDate: Date;

  @Column({ type: 'varchar', length: 255 })
  eventLocation: string;

  @Column({ type: 'varchar', length: 100 })
  categoryName: string;

  @Column({ type: 'varchar', length: 255 })
  userName: string;

  @Column({ type: 'varchar', length: 255 })
  userEmail: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'text', nullable: true })
  qrCodeData: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
  status: TicketStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchasedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  transferredAt: Date;

  @Column({ type: 'uuid', nullable: true })
  transferredTo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transferredToName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transferredToEmail: string;

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

  // Métodos estáticos
  public static create(
    eventId: string,
    userId: string,
    categoryId: string,
    eventTitle: string,
    eventDate: Date,
    eventLocation: string,
    categoryName: string,
    userName: string,
    userEmail: string,
    price: number,
    qrCode?: string,
    qrCodeData?: string,
  ): Ticket {
    const ticket = new Ticket();
    ticket.eventId = eventId;
    ticket.userId = userId;
    ticket.categoryId = categoryId;
    ticket.eventTitle = eventTitle;
    ticket.eventDate = eventDate;
    ticket.eventLocation = eventLocation;
    ticket.categoryName = categoryName;
    ticket.userName = userName;
    ticket.userEmail = userEmail;
    ticket.price = price;
    ticket.qrCode = qrCode;
    ticket.qrCodeData = qrCodeData;
    ticket.status = TicketStatus.ACTIVE;
    ticket.purchasedAt = new Date();
    ticket.createdAt = new Date();
    ticket.updatedAt = new Date();
    return ticket;
  }

  // Métodos de domínio
  public markAsUsed(): void {
    if (this.status !== TicketStatus.ACTIVE) {
      throw new Error('Ticket cannot be used');
    }
    this.status = TicketStatus.USED;
    this.usedAt = new Date();
  }

  public markAsTransferred(newUserId: string, newUserName: string, newUserEmail: string): void {
    if (this.status !== TicketStatus.ACTIVE) {
      throw new Error('Ticket cannot be transferred');
    }
    this.status = TicketStatus.TRANSFERRED;
    this.transferredTo = newUserId;
    this.transferredToName = newUserName;
    this.transferredToEmail = newUserEmail;
    this.transferredAt = new Date();
  }

  public markAsCancelled(): void {
    if (this.status === TicketStatus.USED) {
      throw new Error('Ticket cannot be cancelled');
    }
    this.status = TicketStatus.CANCELLED;
  }
}