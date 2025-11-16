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
    description: 'Has swimming pool',
    example: true,
  })
  hasPool: boolean;

  @ApiProperty({
    description: 'Has jacuzzi',
    example: false,
  })
  hasJacuzzi: boolean;

  @ApiProperty({
    description: 'Ocean front property',
    example: true,
  })
  oceanFront: boolean;

  @ApiProperty({
    description: 'Has garden',
    example: true,
  })
  hasGarden: boolean;

  @ApiProperty({
    description: 'Has gourmet area',
    example: true,
  })
  hasGourmetArea: boolean;

  @ApiProperty({
    description: 'Furnished property',
    example: false,
  })
  furnished: boolean;

  @ApiProperty({
    description: 'ID of the realtor responsible',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
  })
  realtorId: string;

  @ApiPropertyOptional({
    description: 'Complete data of the responsible realtor',
    example: {
      id: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      profile: {
        businessName: 'Imóveis Premium Litoral',
        contactName: 'João Silva',
        phone: '11999999999',
        email: 'contato@imoveispremium.com.br',
        instagram: 'https://instagram.com/imoveispremium',
        facebook: 'https://facebook.com/imoveispremium',
        linkedin: 'https://linkedin.com/in/joaosilva',
        whatsappBusiness: '11999999999',
      },
    },
  })
  realtor?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile?: {
      businessName?: string;
      contactName?: string;
      phone?: string;
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
    dto.hasPool = property.hasPool;
    dto.hasJacuzzi = property.hasJacuzzi;
    dto.oceanFront = property.oceanFront;
    dto.hasGarden = property.hasGarden;
    dto.hasGourmetArea = property.hasGourmetArea;
    dto.furnished = property.furnished;
    dto.realtorId = property.realtorId;
    dto.coverImageUrl = property.coverImageUrl;
    dto.createdAt = property.createdAt;
    dto.updatedAt = property.updatedAt;

    // Include complete realtor data if available
    if (property.realtor) {
      dto.realtor = {
        id: property.realtor.id,
        name: property.realtor.name,
        email: property.realtor.email,
        phone: property.realtor.phone,
      };

      // Include professional profile if available
      if (property.realtor.realtorProfile) {
        dto.realtor.profile = {
          businessName: property.realtor.realtorProfile.businessName,
          contactName: property.realtor.realtorProfile.contactName,
          phone: property.realtor.realtorProfile.phone,
          email: property.realtor.realtorProfile.email,
          instagram: property.realtor.realtorProfile.instagram,
          facebook: property.realtor.realtorProfile.facebook,
          linkedin: property.realtor.realtorProfile.linkedin,
          whatsappBusiness: property.realtor.realtorProfile.whatsappBusiness,
        };
      }
    }

    return dto;
  }
}

