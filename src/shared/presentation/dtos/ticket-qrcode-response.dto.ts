import { ApiProperty } from '@nestjs/swagger';

export class TicketQRCodeResponseDto {
  @ApiProperty({ 
    description: 'Imagem PNG do QR Code em formato base64', 
    example: 'iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51...' 
  })
  qrCode: string;

  @ApiProperty({ 
    description: 'URL completa da API de validação', 
    example: 'https://api-events.gwan.com.br/api/tickets/validate?code=TICKET_CODE_123' 
  })
  url: string;

  @ApiProperty({ 
    description: 'Código do ingresso', 
    example: 'TICKET_CODE_123' 
  })
  ticketCode: string;

  @ApiProperty({ 
    description: 'ID do ingresso', 
    example: 'ticket-uuid-123' 
  })
  ticketId: string;

  constructor(qrCode: string, url: string, ticketCode: string, ticketId: string) {
    this.qrCode = qrCode;
    this.url = url;
    this.ticketCode = ticketCode;
    this.ticketId = ticketId;
  }

  static create(qrCode: string, url: string, ticketCode: string, ticketId: string): TicketQRCodeResponseDto {
    return new TicketQRCodeResponseDto(qrCode, url, ticketCode, ticketId);
  }
}
