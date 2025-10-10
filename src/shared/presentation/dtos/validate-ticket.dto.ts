import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketDto {
  @ApiProperty({ example: 'TICKET_1_2024-06-15_20:00' })
  @IsString()
  @IsNotEmpty()
  qrCodeData: string;
}
