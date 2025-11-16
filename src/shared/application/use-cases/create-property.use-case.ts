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

  async execute(createPropertyDto: CreatePropertyDto, realtorId: string): Promise<Property> {
    this.logger.info('Creating new property', {
      realtorId,
      title: createPropertyDto.title,
      type: createPropertyDto.type,
    });

    // Verify if realtor exists and has valid role
    const realtor = await this.userRepository.findById(realtorId);
    if (!realtor) {
      throw new Error('Realtor not found');
    }

    if (realtor.role !== UserRole.CORRETOR && realtor.role !== UserRole.ADMIN) {
      throw new Error('Only realtors and administrators can create properties');
    }

    // Create Property entity
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
    property.hasPool = createPropertyDto.hasPool ?? false;
    property.hasJacuzzi = createPropertyDto.hasJacuzzi ?? false;
    property.oceanFront = createPropertyDto.oceanFront ?? false;
    property.hasGarden = createPropertyDto.hasGarden ?? false;
    property.hasGourmetArea = createPropertyDto.hasGourmetArea ?? false;
    property.furnished = createPropertyDto.furnished ?? false;
    property.realtorId = realtorId;

    const savedProperty = await this.propertyRepository.save(property);

    this.logger.info('Property created successfully', {
      propertyId: savedProperty.id,
      realtorId,
    });

    return savedProperty;
  }
}

