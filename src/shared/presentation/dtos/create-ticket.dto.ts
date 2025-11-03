import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../../domain/value-objects/document-type.enum';

export class CreateTicketDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiProperty({ example: 'João', description: 'Primeiro nome do titular do(s) ingresso(s)', required: false })
  @IsOptional()
  @IsString()
  holderFirstName?: string;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome do titular do(s) ingresso(s)', required: false })
  @IsOptional()
  @IsString()
  holderLastName?: string;

  @ApiProperty({ 
    example: DocumentType.CPF, 
    description: 'Tipo de documento de identificação',
    enum: DocumentType,
    required: false 
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({ example: '12345678900', description: 'Número do documento de identificação', required: false })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
