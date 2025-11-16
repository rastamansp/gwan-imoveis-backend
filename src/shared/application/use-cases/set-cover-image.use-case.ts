import { Injectable, Inject } from '@nestjs/common';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { PropertyImage } from '../../domain/entities/property-image.entity';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class SetCoverImageUseCase {
  constructor(
    @Inject('IPropertyImageRepository')
    private readonly propertyImageRepository: IPropertyImageRepository,
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(propertyId: string, imageId: string, realtorId: string): Promise<PropertyImage> {
    const startTime = Date.now();

    this.logger.info('Setting image as cover', {
      propertyId,
      imageId,
      realtorId,
    });

    try {
      // Verify property
      const property = await this.propertyRepository.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Verify permissions
      const realtor = await this.userRepository.findById(realtorId);
      if (!realtor) {
        throw new Error('Realtor not found');
      }

      if (realtor.role !== UserRole.CORRETOR && realtor.role !== UserRole.ADMIN) {
        throw new Error('Only realtors and administrators can set cover image');
      }

      if (property.realtorId !== realtorId && realtor.role !== UserRole.ADMIN) {
        throw new Error('Only the property owner or administrator can set cover image');
      }

      // Verificar se a imagem existe e pertence à propriedade
      const image = await this.propertyImageRepository.findById(imageId);
      if (!image) {
        throw new Error('Imagem não encontrada');
      }

      if (image.propertyId !== propertyId) {
        throw new Error('Imagem não pertence a esta propriedade');
      }

      // Remover capa anterior
      const existingCover = await this.propertyImageRepository.findCoverByPropertyId(propertyId);
      if (existingCover && existingCover.id !== imageId) {
        existingCover.removeAsCover();
        await this.propertyImageRepository.save(existingCover);
      }

      // Definir nova capa
      image.setAsCover();
      const updatedImage = await this.propertyImageRepository.save(image);

      // Atualizar coverImageUrl na propriedade
      property.coverImageUrl = updatedImage.url;
      await this.propertyRepository.update(propertyId, property);

      const duration = Date.now() - startTime;
      this.logger.info('Imagem definida como capa com sucesso', {
        imageId: updatedImage.id,
        propertyId,
        duration,
      });

      return updatedImage;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao definir imagem como capa', {
        propertyId,
        imageId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

