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
}


