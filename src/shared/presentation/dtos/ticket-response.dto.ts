import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../../domain/entities/ticket.entity';

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  eventTitle: string;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty()
  eventLocation: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  qrCodeData: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty()
  usedDate?: Date;

  @ApiProperty()
  transferDate?: Date;

  @ApiProperty()
  transferredTo?: string;

  static fromEntity(ticket: Ticket): TicketResponseDto {
    const dto = new TicketResponseDto();
    dto.id = ticket.id;
    dto.eventId = ticket.eventId;
    dto.eventTitle = ticket.eventTitle;
    dto.eventDate = ticket.eventDate;
    dto.eventLocation = ticket.eventLocation;
    dto.categoryId = ticket.categoryId;
    dto.categoryName = ticket.categoryName;
    dto.userId = ticket.userId;
    dto.userName = ticket.userName;
    dto.userEmail = ticket.userEmail;
    dto.price = ticket.price;
    dto.qrCode = ticket.qrCode;
    dto.qrCodeData = ticket.qrCodeData;
    dto.status = ticket.status;
    dto.purchaseDate = ticket.purchaseDate;
    dto.usedDate = ticket.usedDate;
    dto.transferDate = ticket.transferDate;
    dto.transferredTo = ticket.transferredTo;
    return dto;
  }
}
