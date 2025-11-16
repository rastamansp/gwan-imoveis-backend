import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { Property } from '../../domain/entities/property.entity';
import { UpdatePropertyDto } from '../../../properties/presentation/dtos/update-property.dto';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class UpdatePropertyUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(
    propertyId: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
  ): Promise<Property> {
    this.logger.info('Atualizando imóvel', {
      propertyId,
      userId,
    });

    // Buscar imóvel
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new Error('Imóvel não encontrado');
    }

    // Verificar permissões
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = property.corretorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Você não tem permissão para editar este imóvel');
    }

    // Atualizar campos
    if (updatePropertyDto.title !== undefined) {
      property.title = updatePropertyDto.title;
    }
    if (updatePropertyDto.description !== undefined) {
      property.description = updatePropertyDto.description;
    }
    if (updatePropertyDto.type !== undefined) {
      property.type = updatePropertyDto.type;
    }
    if (updatePropertyDto.purpose !== undefined) {
      property.purpose = updatePropertyDto.purpose;
    }
    if (updatePropertyDto.price !== undefined) {
      property.updatePrice(updatePropertyDto.price);
    }
    if (updatePropertyDto.neighborhood !== undefined) {
      property.neighborhood = updatePropertyDto.neighborhood;
    }
    if (updatePropertyDto.city !== undefined) {
      property.city = updatePropertyDto.city;
    }
    if (updatePropertyDto.bedrooms !== undefined) {
      property.bedrooms = updatePropertyDto.bedrooms;
    }
    if (updatePropertyDto.bathrooms !== undefined) {
      property.bathrooms = updatePropertyDto.bathrooms;
    }
    if (updatePropertyDto.area !== undefined) {
      property.updateArea(updatePropertyDto.area);
    }
    if (updatePropertyDto.garageSpaces !== undefined) {
      property.garageSpaces = updatePropertyDto.garageSpaces;
    }
    if (updatePropertyDto.piscina !== undefined) {
      property.piscina = updatePropertyDto.piscina;
    }
    if (updatePropertyDto.hidromassagem !== undefined) {
      property.hidromassagem = updatePropertyDto.hidromassagem;
    }
    if (updatePropertyDto.frenteMar !== undefined) {
      property.frenteMar = updatePropertyDto.frenteMar;
    }
    if (updatePropertyDto.jardim !== undefined) {
      property.jardim = updatePropertyDto.jardim;
    }
    if (updatePropertyDto.areaGourmet !== undefined) {
      property.areaGourmet = updatePropertyDto.areaGourmet;
    }
    if (updatePropertyDto.mobiliado !== undefined) {
      property.mobiliado = updatePropertyDto.mobiliado;
    }

    property.updatedAt = new Date();

    const updatedProperty = await this.propertyRepository.update(propertyId, property);

    this.logger.info('Imóvel atualizado com sucesso', {
      propertyId: updatedProperty.id,
      userId,
    });

    return updatedProperty;
  }
}

