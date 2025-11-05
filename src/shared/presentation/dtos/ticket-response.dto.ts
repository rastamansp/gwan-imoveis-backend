import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../../domain/entities/ticket.entity';
import { DocumentType } from '../../domain/value-objects/document-type.enum';

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

  @ApiProperty({ required: false, description: 'QR Code em base64 (apenas quando solicitado explicitamente)' })
  qrCode?: string;

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

  @ApiProperty({ required: false, description: 'Primeiro nome do titular do ingresso' })
  holderFirstName?: string | null;

  @ApiProperty({ required: false, description: 'Sobrenome do titular do ingresso' })
  holderLastName?: string | null;

  @ApiProperty({ required: false, description: 'Tipo de documento de identificação', enum: DocumentType })
  documentType?: DocumentType | null;

  @ApiProperty({ required: false, description: 'Número do documento de identificação' })
  documentNumber?: string | null;

  static fromEntity(ticket: Ticket, includeQRCode: boolean = false): TicketResponseDto {
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
    // Apenas incluir qrCode se explicitamente solicitado (para reduzir tamanho do payload)
    if (includeQRCode && ticket.qrCode) {
      dto.qrCode = ticket.qrCode;
    }
    dto.qrCodeData = ticket.qrCodeData;
    dto.status = ticket.status;
    dto.purchaseDate = ticket.purchasedAt;
    dto.usedDate = ticket.usedAt;
    dto.transferDate = ticket.transferredAt;
    dto.transferredTo = ticket.transferredTo;
    dto.holderFirstName = ticket.holderFirstName ?? undefined;
    dto.holderLastName = ticket.holderLastName ?? undefined;
    dto.documentType = ticket.documentType ?? undefined;
    dto.documentNumber = ticket.documentNumber ?? undefined;
    return dto;
  }
}
