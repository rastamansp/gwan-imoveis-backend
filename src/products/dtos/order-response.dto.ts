import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../shared/domain/entities/order.entity';
import { OrderItem } from '../../shared/domain/entities/order-item.entity';
import { OrderStatus } from '../../shared/domain/value-objects/order-status.enum';
import { OrderItemStatus } from '../../shared/domain/value-objects/order-item-status.enum';
import { ProductResponseDto } from './product-response.dto';

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  qrCodeData: string;

  @ApiProperty({ nullable: true })
  qrCodeImage: string | null;

  @ApiProperty({ nullable: true })
  validatedAt: Date | null;

  @ApiProperty({ nullable: true })
  validatedBy: string | null;

  @ApiProperty({ enum: OrderItemStatus })
  status: OrderItemStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: ProductResponseDto, required: false })
  product?: ProductResponseDto;

  static fromEntity(orderItem: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.id = orderItem.id;
    dto.orderId = orderItem.orderId;
    dto.productId = orderItem.productId;
    dto.quantity = orderItem.quantity;
    dto.unitPrice = Number(orderItem.unitPrice);
    dto.totalPrice = orderItem.getTotalPrice();
    dto.qrCodeData = orderItem.qrCodeData;
    dto.qrCodeImage = orderItem.qrCodeImage;
    dto.validatedAt = orderItem.validatedAt;
    dto.validatedBy = orderItem.validatedBy;
    dto.status = orderItem.status;
    dto.createdAt = orderItem.createdAt;
    dto.updatedAt = orderItem.updatedAt;
    if (orderItem.product) {
      dto.product = ProductResponseDto.fromEntity(orderItem.product);
    }
    return dto;
  }
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ nullable: true })
  ticketId: string | null;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [OrderItemResponseDto], required: false })
  items?: OrderItemResponseDto[];

  static fromEntity(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.userId = order.userId;
    dto.eventId = order.eventId;
    dto.ticketId = order.ticketId;
    dto.totalAmount = order.getTotalAmount();
    dto.status = order.status;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    if (order.items) {
      dto.items = order.items.map(item => OrderItemResponseDto.fromEntity(item));
    }
    return dto;
  }
}

