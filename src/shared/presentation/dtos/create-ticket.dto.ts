import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsEnum, IsArray, ValidateNested, IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType } from '../../domain/value-objects/document-type.enum';

export class ParticipantDto {
  @ApiProperty({ example: 'Pedro', description: 'Primeiro nome do participante' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Almeida', description: 'Sobrenome do participante' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'pedro@gmail.com', description: 'Email do participante', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '123.456.789-78', description: 'Documento do participante (CPF)', required: false })
  @IsOptional()
  @IsString()
  document?: string;
}

export class CreateTicketDto {
  @ApiProperty({ example: '89a91565-38eb-4dea-8166-ac251617fa72' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'bda8f16d-a2e6-4722-a096-38f89094adbc' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 1, description: 'Quantidade de ingressos a comprar' })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number;

  @ApiProperty({ 
    type: [ParticipantDto],
    description: 'Array de participantes (um por ingresso). Se não fornecido, será usado o usuário logado.',
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants?: ParticipantDto[];

  @ApiProperty({ 
    example: 'PIX', 
    description: 'Método de pagamento (PIX, CREDIT_CARD, DEBIT_CARD). O pagamento será iniciado mas não efetuado.',
    required: false,
    enum: ['PIX', 'CREDIT_CARD', 'DEBIT_CARD']
  })
  @IsOptional()
  @IsString()
  @IsIn(['PIX', 'CREDIT_CARD', 'DEBIT_CARD'])
  paymentMethod?: string;

  // Campos legados para compatibilidade (mantidos para não quebrar código existente)
  @ApiProperty({ example: 'João', description: 'Primeiro nome do titular do(s) ingresso(s) - DEPRECATED: use participants', required: false })
  @IsOptional()
  @IsString()
  holderFirstName?: string;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome do titular do(s) ingresso(s) - DEPRECATED: use participants', required: false })
  @IsOptional()
  @IsString()
  holderLastName?: string;

  @ApiProperty({ 
    example: DocumentType.CPF, 
    description: 'Tipo de documento de identificação - DEPRECATED: use participants',
    enum: DocumentType,
    required: false 
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({ example: '12345678900', description: 'Número do documento de identificação - DEPRECATED: use participants', required: false })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
