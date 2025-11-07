import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { OrderItemStatus } from '../value-objects/order-item-status.enum';

@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['status'])
@Index(['qrCodeData'], { unique: true })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  qrCodeData: string;

  @Column({ type: 'text', nullable: true })
  qrCodeImage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validatedBy: string | null;

  @Column({ type: 'enum', enum: OrderItemStatus, default: OrderItemStatus.PENDING })
  status: OrderItemStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  // Métodos estáticos
  public static create(
    orderId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    qrCodeData: string,
    qrCodeImage?: string | null,
  ): OrderItem {
    const orderItem = new OrderItem();
    orderItem.orderId = orderId;
    orderItem.productId = productId;
    orderItem.quantity = quantity;
    orderItem.unitPrice = unitPrice;
    orderItem.totalPrice = unitPrice * quantity;
    orderItem.qrCodeData = qrCodeData;
    orderItem.qrCodeImage = qrCodeImage || null;
    orderItem.status = OrderItemStatus.PENDING;
    orderItem.createdAt = new Date();
    orderItem.updatedAt = new Date();
    return orderItem;
  }

  // Métodos de domínio
  public validate(validatedBy: string): void {
    if (this.status !== OrderItemStatus.PENDING) {
      throw new Error('Order item cannot be validated');
    }
    this.status = OrderItemStatus.VALIDATED;
    this.validatedAt = new Date();
    this.validatedBy = validatedBy;
    this.updatedAt = new Date();
  }

  public cancel(): void {
    if (this.status === OrderItemStatus.VALIDATED) {
      throw new Error('Validated items cannot be cancelled');
    }
    this.status = OrderItemStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  public isPending(): boolean {
    return this.status === OrderItemStatus.PENDING;
  }

  public isValidated(): boolean {
    return this.status === OrderItemStatus.VALIDATED;
  }

  public getTotalPrice(): number {
    return Number(this.totalPrice);
  }

  public belongsToOrder(orderId: string): boolean {
    return this.orderId === orderId;
  }
}

