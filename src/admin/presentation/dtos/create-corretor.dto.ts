import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCorretorDto {
  @ApiProperty({ description: 'Nome completo do corretor' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'E-mail de acesso' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha de acesso (mínimo 6 caracteres)', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Nome fantasia / imobiliária' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'WhatsApp Business' })
  @IsOptional()
  @IsString()
  whatsappBusiness?: string;
}
