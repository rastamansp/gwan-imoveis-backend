import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRealtorProfileDto {
  @ApiPropertyOptional({
    description: 'Business name of the realtor',
    example: 'Imóveis Premium Litoral',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'João Silva',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '11999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contato',
    example: 'contato@imoveispremium.com.br',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'URL do Instagram',
    example: 'https://instagram.com/imoveispremium',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  instagram?: string;

  @ApiPropertyOptional({
    description: 'URL do Facebook',
    example: 'https://facebook.com/imoveispremium',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  facebook?: string;

  @ApiPropertyOptional({
    description: 'URL do LinkedIn',
    example: 'https://linkedin.com/in/joaosilva',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Número do WhatsApp Business',
    example: '11999999999',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappBusiness?: string;
}

