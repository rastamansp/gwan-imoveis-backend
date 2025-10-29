import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({ example: 'TICKET_CODE_123' })
  @IsString()
  @IsNotEmpty()
  qrCodeData: string;
}
