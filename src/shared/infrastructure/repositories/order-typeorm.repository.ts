import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { IOrderRepository, IOrderItemRepository } from '../../domain/interfaces/order-repository.interface';

@Injectable()
export class OrderTypeOrmRepository implements IOrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async save(order: Order): Promise<Order> {
    return await this.orderRepository.save(order);
  }

  async findById(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'event', 'user'],
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product', 'event'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEventId(eventId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { eventId },
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdAndEventId(userId: string, eventId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { userId, eventId },
      relations: ['items', 'items.product', 'event'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updatedOrder: Order): Promise<Order | null> {
    const result = await this.orderRepository.update(id, updatedOrder);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderRepository.delete(id);
    return result.affected > 0;
  }
}

@Injectable()
export class OrderItemTypeOrmRepository implements IOrderItemRepository {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async save(orderItem: OrderItem): Promise<OrderItem> {
    return await this.orderItemRepository.save(orderItem);
  }

  async findById(id: string): Promise<OrderItem | null> {
    return await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'product'],
    });
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { orderId },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByQrCodeData(qrCodeData: string): Promise<OrderItem | null> {
    return await this.orderItemRepository.findOne({
      where: { qrCodeData },
      relations: ['order', 'product', 'order.event'],
    });
  }

  async update(id: string, updatedOrderItem: OrderItem): Promise<OrderItem | null> {
    const result = await this.orderItemRepository.update(id, updatedOrderItem);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderItemRepository.delete(id);
    return result.affected > 0;
  }
}

