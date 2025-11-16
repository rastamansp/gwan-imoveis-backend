import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { CreatePropertyDto } from '../../../properties/presentation/dtos/create-property.dto';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { PropertyPurpose } from '../../domain/value-objects/property-purpose.enum';

@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(createPropertyDto: CreatePropertyDto, corretorId: string): Promise<Property> {
    this.logger.info('Criando novo imóvel', {
      corretorId,
      title: createPropertyDto.title,
      type: createPropertyDto.type,
    });

    // Verificar se o corretor existe e tem role válida
    const corretor = await this.userRepository.findById(corretorId);
    if (!corretor) {
      throw new Error('Corretor não encontrado');
    }

    if (corretor.role !== UserRole.CORRETOR && corretor.role !== UserRole.ADMIN) {
      throw new Error('Apenas corretores e administradores podem criar imóveis');
    }

    // Criar entidade Property
    const property = new Property();
    property.title = createPropertyDto.title;
    property.description = createPropertyDto.description;
    property.type = createPropertyDto.type;
    property.purpose = createPropertyDto.purpose ?? PropertyPurpose.RENT;
    property.price = createPropertyDto.price;
    property.neighborhood = createPropertyDto.neighborhood;
    property.city = createPropertyDto.city;
    property.bedrooms = createPropertyDto.bedrooms;
    property.bathrooms = createPropertyDto.bathrooms;
    property.area = createPropertyDto.area;
    property.garageSpaces = createPropertyDto.garageSpaces;
    property.piscina = createPropertyDto.piscina ?? false;
    property.hidromassagem = createPropertyDto.hidromassagem ?? false;
    property.frenteMar = createPropertyDto.frenteMar ?? false;
    property.jardim = createPropertyDto.jardim ?? false;
    property.areaGourmet = createPropertyDto.areaGourmet ?? false;
    property.mobiliado = createPropertyDto.mobiliado ?? false;
    property.corretorId = corretorId;

    const savedProperty = await this.propertyRepository.save(property);

    this.logger.info('Imóvel criado com sucesso', {
      propertyId: savedProperty.id,
      corretorId,
    });

    return savedProperty;
  }
}

