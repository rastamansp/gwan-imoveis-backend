import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({
    description: 'Mensagem do usuário para o agente',
    example: 'Liste eventos em São Paulo na categoria Música',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Contexto adicional do usuário (preferências, localização, etc.)',
    example: { city: 'São Paulo', language: 'pt-BR' },
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  userCtx?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'ID da sessão de conversa existente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Número de telefone do WhatsApp (para criar/buscar sessão)',
    example: '5511999999999',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}


