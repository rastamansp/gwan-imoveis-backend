import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export const IOrderRepository = Symbol('IOrderRepository');

export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findByEventId(eventId: string): Promise<Order[]>;
  findByUserIdAndEventId(userId: string, eventId: string): Promise<Order[]>;
  update(id: string, order: Order): Promise<Order | null>;
  delete(id: string): Promise<boolean>;
}

export const IOrderItemRepository = Symbol('IOrderItemRepository');

export interface IOrderItemRepository {
  save(orderItem: OrderItem): Promise<OrderItem>;
  findById(id: string): Promise<OrderItem | null>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
  findByQrCodeData(qrCodeData: string): Promise<OrderItem | null>;
  update(id: string, orderItem: OrderItem): Promise<OrderItem | null>;
  delete(id: string): Promise<boolean>;
}

