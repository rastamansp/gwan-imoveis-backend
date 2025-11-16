import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Property } from '../../../shared/domain/entities/property.entity';
import { PropertyType } from '../../../shared/domain/value-objects/property-type.enum';
import { PropertyPurpose } from '../../../shared/domain/value-objects/property-purpose.enum';

export class PropertyResponseDto {
  @ApiProperty({
    description: 'ID único do imóvel',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  id: string;

  @ApiProperty({
    description: 'Título do anúncio',
    example: 'Casa de Praia Luxuosa com Vista para o Mar',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição do imóvel',
    example: 'Casa espaçosa com 3 quartos, 2 banheiros, área gourmet e piscina.',
  })
  description: string;

  @ApiProperty({
    description: 'Tipo do imóvel',
    enum: PropertyType,
    example: PropertyType.CASA,
  })
  type: PropertyType;

  @ApiProperty({
    description: 'Finalidade do imóvel',
    enum: PropertyPurpose,
    example: PropertyPurpose.RENT,
  })
  purpose: PropertyPurpose;

  @ApiProperty({
    description: 'Preço em reais',
    example: 850000.00,
  })
  price: number;

  @ApiProperty({
    description: 'Bairro ou praia',
    example: 'Maresias',
  })
  neighborhood: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Sebastião',
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Número de quartos',
    example: 3,
  })
  bedrooms?: number;

  @ApiPropertyOptional({
    description: 'Número de banheiros',
    example: 2,
  })
  bathrooms?: number;

  @ApiProperty({
    description: 'Área em metros quadrados',
    example: 150.50,
  })
  area: number;

  @ApiPropertyOptional({
    description: 'Número de vagas de garagem',
    example: 2,
  })
  garageSpaces?: number;

  @ApiProperty({
    description: 'Possui piscina',
    example: true,
  })
  piscina: boolean;

  @ApiProperty({
    description: 'Possui hidromassagem',
    example: false,
  })
  hidromassagem: boolean;

  @ApiProperty({
    description: 'Frente para o mar',
    example: true,
  })
  frenteMar: boolean;

  @ApiProperty({
    description: 'Possui jardim',
    example: true,
  })
  jardim: boolean;

  @ApiProperty({
    description: 'Possui área gourmet',
    example: true,
  })
  areaGourmet: boolean;

  @ApiProperty({
    description: 'Imóvel mobiliado',
    example: false,
  })
  mobiliado: boolean;

  @ApiProperty({
    description: 'ID do corretor responsável',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  corretorId: string;

  @ApiPropertyOptional({
    description: 'Dados completos do corretor responsável',
    example: {
      id: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      profile: {
        nomeFantasia: 'Imóveis Premium Litoral',
        nomeContato: 'João Silva',
        telefone: '11999999999',
        email: 'contato@imoveispremium.com.br',
        instagram: 'https://instagram.com/imoveispremium',
        facebook: 'https://facebook.com/imoveispremium',
        linkedin: 'https://linkedin.com/in/joaosilva',
        whatsappBusiness: '11999999999',
      },
    },
  })
  corretor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile?: {
      nomeFantasia?: string;
      nomeContato?: string;
      telefone?: string;
      email?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
      whatsappBusiness?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'URL da imagem de capa',
    example: 'https://minio.gwan.com.br:9000/gwan-imoveis-uploads/properties/123/original-image.jpg',
  })
  coverImageUrl?: string;

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

  static fromEntity(property: Property): PropertyResponseDto {
    const dto = new PropertyResponseDto();
    dto.id = property.id;
    dto.title = property.title;
    dto.description = property.description;
    dto.type = property.type;
    dto.purpose = property.purpose;
    dto.price = Number(property.price);
    dto.neighborhood = property.neighborhood;
    dto.city = property.city;
    dto.bedrooms = property.bedrooms;
    dto.bathrooms = property.bathrooms;
    dto.area = Number(property.area);
    dto.garageSpaces = property.garageSpaces;
    dto.piscina = property.piscina;
    dto.hidromassagem = property.hidromassagem;
    dto.frenteMar = property.frenteMar;
    dto.jardim = property.jardim;
    dto.areaGourmet = property.areaGourmet;
    dto.mobiliado = property.mobiliado;
    dto.corretorId = property.corretorId;
    dto.coverImageUrl = property.coverImageUrl;
    dto.createdAt = property.createdAt;
    dto.updatedAt = property.updatedAt;

    // Incluir dados completos do corretor se disponível
    if (property.corretor) {
      dto.corretor = {
        id: property.corretor.id,
        name: property.corretor.name,
        email: property.corretor.email,
        phone: property.corretor.phone,
      };

      // Incluir perfil profissional se disponível
      if (property.corretor.realtorProfile) {
        dto.corretor.profile = {
          nomeFantasia: property.corretor.realtorProfile.nomeFantasia,
          nomeContato: property.corretor.realtorProfile.nomeContato,
          telefone: property.corretor.realtorProfile.telefone,
          email: property.corretor.realtorProfile.email,
          instagram: property.corretor.realtorProfile.instagram,
          facebook: property.corretor.realtorProfile.facebook,
          linkedin: property.corretor.realtorProfile.linkedin,
          whatsappBusiness: property.corretor.realtorProfile.whatsappBusiness,
        };
      }
    }

    return dto;
  }
}

