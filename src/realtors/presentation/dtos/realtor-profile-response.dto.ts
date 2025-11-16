import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RealtorProfile } from '../../../shared/domain/entities/realtor-profile.entity';

export class RealtorProfileResponseDto {
  @ApiProperty({
    description: 'ID único do perfil',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário corretor',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Business name of the realtor',
    example: 'Imóveis Premium Litoral',
  })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Contact name',
    example: 'João Silva',
  })
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '11999999999',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email de contato',
    example: 'contato@imoveispremium.com.br',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'URL do Instagram',
    example: 'https://instagram.com/imoveispremium',
  })
  instagram?: string;

  @ApiPropertyOptional({
    description: 'URL do Facebook',
    example: 'https://facebook.com/imoveispremium',
  })
  facebook?: string;

  @ApiPropertyOptional({
    description: 'URL do LinkedIn',
    example: 'https://linkedin.com/in/joaosilva',
  })
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Número do WhatsApp Business',
    example: '11999999999',
  })
  whatsappBusiness?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(profile: RealtorProfile): RealtorProfileResponseDto {
    const dto = new RealtorProfileResponseDto();
    dto.id = profile.id;
    dto.userId = profile.userId;
    dto.businessName = profile.businessName;
    dto.contactName = profile.contactName;
    dto.phone = profile.phone;
    dto.email = profile.email;
    dto.instagram = profile.instagram;
    dto.facebook = profile.facebook;
    dto.linkedin = profile.linkedin;
    dto.whatsappBusiness = profile.whatsappBusiness;
    dto.createdAt = profile.createdAt;
    dto.updatedAt = profile.updatedAt;
    return dto;
  }
}

