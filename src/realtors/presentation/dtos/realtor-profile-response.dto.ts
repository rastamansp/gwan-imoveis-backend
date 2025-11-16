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
    description: 'Nome fantasia do corretor',
    example: 'Imóveis Premium Litoral',
  })
  nomeFantasia?: string;

  @ApiPropertyOptional({
    description: 'Nome do contato',
    example: 'João Silva',
  })
  nomeContato?: string;

  @ApiPropertyOptional({
    description: 'Número de telefone',
    example: '11999999999',
  })
  telefone?: string;

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
    dto.nomeFantasia = profile.nomeFantasia;
    dto.nomeContato = profile.nomeContato;
    dto.telefone = profile.telefone;
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

