import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyConversationDto {
  @ApiProperty({ description: 'Texto da resposta a ser enviada via WhatsApp', maxLength: 4096 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(4096)
  text: string;
}
