import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferTicketDto {
  @ApiProperty({ example: 'user-id-123' })
  @IsString()
  @IsNotEmpty()
  newUserId: string;

  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty()
  newUserName: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  newUserEmail: string;
}
